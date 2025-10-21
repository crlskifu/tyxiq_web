import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import * as path from "path";
import * as fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertNewsSchema, 
  insertProjectSchema, 
  updateUserProfileSchema,
  type InsertNews,
  type InsertProject
} from "@shared/schema";
import { z } from "zod";

// Создаем директорию для загрузок если она не существует
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища для multer
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Конфигурация multer
const upload = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Увеличиваем ограничение размера файла (50MB)
  }
});

// Middleware для проверки аутентификации
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  next();
};

// Middleware для проверки прав администратора
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Необходимы права администратора" });
  }
  
  next();
};

// Middleware для валидации запросов
const validateRequest = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Ошибка валидации данных", 
          errors: error.errors 
        });
      }
      next(error);
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Настройка аутентификации
  setupAuth(app);
  
  // Настраиваем статическую директорию для загрузок
  app.use('/uploads', express.static(uploadDir));
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Маршрут для загрузки файлов
  app.post('/api/upload', isAdmin, upload.array('files', 10), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Не выбрано ни одного файла" });
      }
      
      // Формируем URL-адреса файлов
      const fileUrls = files.map(file => `/uploads/${file.filename}`);
      
      // Возвращаем ссылки на загруженные файлы
      res.status(201).json({ 
        files: fileUrls,
        message: "Файлы успешно загружены" 
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Ошибка загрузки файлов" });
    }
  });

  // Маршруты для пользователей
  app.get('/api/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Скрываем пароли из ответа
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Ошибка получения списка пользователей" });
    }
  });

  app.put('/api/users/profile', isAuthenticated, validateRequest(updateUserProfileSchema), async (req, res) => {
    try {
      const userId = req.user!.id;
      const updatedUser = await storage.updateUserProfile(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      // Скрываем пароль из ответа
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Ошибка обновления профиля" });
    }
  });
  
  // Маршруты для новостей
  app.get('/api/news', async (req, res) => {
    try {
      const allNews = await storage.getAllNews();
      res.json(allNews);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Ошибка получения новостей" });
    }
  });
  
  app.get('/api/news/:id', async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      if (isNaN(newsId)) {
        return res.status(400).json({ message: "Неверный ID новости" });
      }
      
      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
      }
      
      res.json(newsItem);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Ошибка получения новости" });
    }
  });
  
  app.post('/api/news', isAdmin, validateRequest(insertNewsSchema), async (req, res) => {
    try {
      const newsData: InsertNews = {
        ...req.body,
        userId: req.user!.id
      };
      
      const createdNews = await storage.createNews(newsData);
      res.status(201).json(createdNews);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Ошибка создания новости" });
    }
  });
  
  app.put('/api/news/:id', isAuthenticated, async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      if (isNaN(newsId)) {
        return res.status(400).json({ message: "Неверный ID новости" });
      }
      
      // Проверка прав пользователя
      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
      }
      
      // Администратор может редактировать любую новость, остальные только свои
      const isAdmin = req.user?.role === "admin";
      if (!isAdmin && newsItem.userId !== req.user!.id) {
        return res.status(403).json({ message: "У вас нет прав на редактирование этой новости" });
      }
      
      const updatedNews = await storage.updateNews(newsId, req.body);
      res.json(updatedNews);
    } catch (error) {
      console.error("Error updating news:", error);
      res.status(500).json({ message: "Ошибка обновления новости" });
    }
  });
  
  app.delete('/api/news/:id', isAuthenticated, async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      if (isNaN(newsId)) {
        return res.status(400).json({ message: "Неверный ID новости" });
      }
      
      // Проверка прав пользователя
      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ message: "Новость не найдена" });
      }
      
      // Администратор может удалять любую новость, остальные только свои
      const isAdmin = req.user?.role === "admin";
      if (!isAdmin && newsItem.userId !== req.user!.id) {
        return res.status(403).json({ message: "У вас нет прав на удаление этой новости" });
      }
      
      const success = await storage.deleteNews(newsId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Новость не найдена" });
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "Ошибка удаления новости" });
    }
  });
  
  // Маршруты для проектов
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Ошибка получения проектов" });
    }
  });
  
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Неверный ID проекта" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проект не найден" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Ошибка получения проекта" });
    }
  });
  
  app.post('/api/projects', isAdmin, validateRequest(insertProjectSchema), async (req, res) => {
    try {
      const projectData: InsertProject = {
        ...req.body,
        userId: req.user!.id
      };
      
      const createdProject = await storage.createProject(projectData);
      res.status(201).json(createdProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Ошибка создания проекта" });
    }
  });
  
  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Неверный ID проекта" });
      }
      
      // Проверка прав пользователя
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проект не найден" });
      }
      
      // Администратор может редактировать любой проект, остальные только свои
      const isAdmin = req.user?.role === "admin";
      if (!isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "У вас нет прав на редактирование этого проекта" });
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Ошибка обновления проекта" });
    }
  });
  
  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Неверный ID проекта" });
      }
      
      // Проверка прав пользователя
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проект не найден" });
      }
      
      // Администратор может удалять любой проект, остальные только свои
      const isAdmin = req.user?.role === "admin";
      if (!isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "У вас нет прав на удаление этого проекта" });
      }
      
      const success = await storage.deleteProject(projectId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Проект не найден" });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Ошибка удаления проекта" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
