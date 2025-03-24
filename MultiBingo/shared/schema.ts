import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  wallet: integer("wallet").notNull().default(5000), // 50.00 in cents
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(), // YW9403 format
  active: boolean("active").notNull().default(true),
  stake: integer("stake").notNull(), // In cents
  calledNumbers: json("called_numbers").$type<number[]>().notNull().default([]),
  currentCall: integer("current_call"),
  countdown: integer("countdown").notNull().default(30),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertGameSchema = createInsertSchema(games).pick({
  gameId: true,
  stake: true,
});

// Player model (joins users and games)
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  cardNumbers: json("card_numbers").$type<number[][]>().notNull(), // 5x5 Bingo card
  markedNumbers: json("marked_numbers").$type<number[]>().notNull().default([]),
  hasBingo: boolean("has_bingo").notNull().default(false),
  boardNumber: integer("board_number").notNull(), // Card identifier
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  userId: true,
  gameId: true,
  cardNumbers: true,
  boardNumber: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

// WebSocket message types
export const wsMessageSchema = z.object({
  type: z.enum([
    'JOIN_GAME',
    'LEAVE_GAME',
    'START_GAME',
    'NUMBER_CALLED',
    'MARK_NUMBER',
    'CLAIM_BINGO',
    'GAME_UPDATED',
    'GAME_ENDED',
    'ERROR'
  ]),
  payload: z.any()
});

export type WSMessage = z.infer<typeof wsMessageSchema>;
