import {
  users, news, projects,
  type User, type InsertUser, type UpdateUserProfile,
  type News, type InsertNews,
  type Project, type InsertProject
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import pg from "pg";
import ConnectPgSimple from "connect-pg-simple";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import "dotenv/config";

const { Pool } = pg;

const MemoryStore = createMemoryStore(session);
const PgSession = ConnectPgSimple(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Управление пользователями
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined>;
  
  // Управление новостями
  getAllNews(): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<boolean>;
  
  // Управление проектами
  getAllProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Управление сессиями
  sessionStore: session.Store;
  
  // Инициализация таблиц
  initDatabase(): Promise<void>;
}

// PostgreSQL хранилище
export class PostgresStorage implements IStorage {
  private pool: any;
  private db: any;
  sessionStore: session.Store;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.db = drizzle(this.pool);
    
    this.sessionStore = new PgSession({
      pool: this.pool,
      tableName: "session"
    });
  }
  
  async initDatabase(): Promise<void> {
    try {
      // Создаем таблицу сессий, если она не существует
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `);
      
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  // Методы для работы с пользователями
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined> {
    try {
      const result = await this.db
        .update(users)
        .set(profile)
        .where(eq(users.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Методы для работы с новостями
  async getAllNews(): Promise<News[]> {
    try {
      return await this.db.select().from(news);
    } catch (error) {
      console.error("Error getting all news:", error);
      throw error;
    }
  }

  async getNewsById(id: number): Promise<News | undefined> {
    try {
      const result = await this.db.select().from(news).where(eq(news.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting news by id:", error);
      throw error;
    }
  }

  async createNews(newsItem: InsertNews): Promise<News> {
    try {
      const result = await this.db.insert(news).values(newsItem).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  }

  async updateNews(id: number, newsUpdate: Partial<InsertNews>): Promise<News | undefined> {
    try {
      const result = await this.db
        .update(news)
        .set(newsUpdate)
        .where(eq(news.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating news:", error);
      throw error;
    }
  }

  async deleteNews(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(news).where(eq(news.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting news:", error);
      throw error;
    }
  }

  // Методы для работы с проектами
  async getAllProjects(): Promise<Project[]> {
    try {
      return await this.db.select().from(projects);
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    try {
      const result = await this.db.select().from(projects).where(eq(projects.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting project by id:", error);
      throw error;
    }
  }

  async createProject(projectItem: InsertProject): Promise<Project> {
    try {
      const result = await this.db.insert(projects).values(projectItem).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const result = await this.db
        .update(projects)
        .set(projectUpdate)
        .where(eq(projects.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }
}

// Оставляем MemStorage в качестве резервного варианта
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private newsItems: Map<number, News>;
  private projectItems: Map<number, Project>;
  
  private userId: number;
  private newsId: number;
  private projectId: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.newsItems = new Map();
    this.projectItems = new Map();
    
    this.userId = 1;
    this.newsId = 1;
    this.projectId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Очистка сессий каждые 24 часа
    });
  }

  // Методы для работы с пользователями
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    // Копируем данные, но исключаем поле role из распаковки
    const { role, ...userData } = insertUser;
    
    const user: User = { 
      ...userData, 
      id, 
      avatar: null, 
      bio: null, 
      // Гарантируем, что role всегда будет строкой
      role: (role as string) || "user", 
      createdAt: createdAt 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...profile
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Методы для работы с новостями
  async getAllNews(): Promise<News[]> {
    return Array.from(this.newsItems.values());
  }
  
  async getNewsById(id: number): Promise<News | undefined> {
    return this.newsItems.get(id);
  }
  
  async createNews(newsItem: InsertNews): Promise<News> {
    const id = this.newsId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const news: News = {
      ...newsItem,
      id,
      files: newsItem.files || [],
      createdAt,
      updatedAt
    };
    
    this.newsItems.set(id, news);
    return news;
  }
  
  async updateNews(id: number, newsUpdate: Partial<InsertNews>): Promise<News | undefined> {
    const news = this.newsItems.get(id);
    if (!news) return undefined;
    
    const updatedNews: News = {
      ...news,
      ...newsUpdate,
      updatedAt: new Date()
    };
    
    this.newsItems.set(id, updatedNews);
    return updatedNews;
  }
  
  async deleteNews(id: number): Promise<boolean> {
    return this.newsItems.delete(id);
  }
  
  // Методы для работы с проектами
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projectItems.values());
  }
  
  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projectItems.get(id);
  }
  
  async createProject(projectItem: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const project = {
      ...projectItem,
      id,
      createdAt,
      updatedAt,
      imageUrl: projectItem.imageUrl || "",
      url: projectItem.url || "",
      files: projectItem.files || []
    } as Project;
    
    this.projectItems.set(id, project);
    return project;
  }
  
  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projectItems.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = {
      ...project,
      ...projectUpdate,
      updatedAt: new Date()
    };
    
    this.projectItems.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projectItems.delete(id);
  }
  
  async initDatabase(): Promise<void> {
    // Для MemStorage не требуется инициализация
    console.log("MemStorage: No database initialization required");
    return Promise.resolve();
  }
}

// Временно используем MemStorage пока отлаживаем подключение к PostgreSQL
export const storage = new MemStorage();
