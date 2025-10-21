import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Пользователи
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  role: text("role").notNull().default("user"), // user или admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Схема для обновления профиля
export const updateUserProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500).optional(),
});

// Новости
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  files: text("files").array(),  // Массив URL-адресов загруженных файлов
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).pick({
  title: true,
  content: true,
  files: true,
  userId: true,
});

// Проекты
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  url: text("url").notNull().default(""),
  files: text("files").array(),  // Массив URL-адресов загруженных файлов
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  imageUrl: true,
  url: true,
  files: true,
  userId: true,
});

// Типы экспорта
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
