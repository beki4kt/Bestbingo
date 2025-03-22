import { users, type User, type InsertUser, games, type Game, type InsertGame, players, type Player, type InsertPlayer } from "@shared/schema";
import { generateGameId, generateBingoCard } from "../shared/gameUtils";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, amount: number): Promise<User | undefined>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGameByGameId(gameId: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  getActiveGames(): Promise<Game[]>;
  updateGameCall(gameId: number, number: number, countdown: number): Promise<Game | undefined>;
  endGame(gameId: number): Promise<Game | undefined>;
  
  // Player operations
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayersByGameId(gameId: number): Promise<Player[]>;
  getPlayerByUserAndGame(userId: number, gameId: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  markNumber(playerId: number, number: number): Promise<Player | undefined>;
  claimBingo(playerId: number): Promise<Player | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private players: Map<number, Player>;
  
  private userCurrentId: number;
  private gameCurrentId: number;
  private playerCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.players = new Map();
    
    this.userCurrentId = 1;
    this.gameCurrentId = 1;
    this.playerCurrentId = 1;
    
    // Initialize with a default user
    this.createUser({ username: "player1", password: "password123" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, wallet: 5000 }; // 50.00 in cents
    this.users.set(id, user);
    return user;
  }
  
  async updateUserWallet(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, wallet: user.wallet + amount };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGameByGameId(gameId: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.gameId === gameId,
    );
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameCurrentId++;
    const game: Game = { 
      ...insertGame, 
      id, 
      active: true, 
      calledNumbers: [], 
      currentCall: null, 
      countdown: 30,
      createdAt: new Date(), 
      endedAt: null 
    };
    this.games.set(id, game);
    return game;
  }
  
  async getActiveGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.active);
  }
  
  async updateGameCall(gameId: number, number: number, countdown: number): Promise<Game | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    const calledNumbers = [...game.calledNumbers, number];
    const updatedGame = { 
      ...game, 
      calledNumbers, 
      currentCall: number,
      countdown
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }
  
  async endGame(gameId: number): Promise<Game | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    const updatedGame = { 
      ...game, 
      active: false,
      endedAt: new Date() 
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }
  
  // Player operations
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async getPlayersByGameId(gameId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      player => player.gameId === gameId
    );
  }
  
  async getPlayerByUserAndGame(userId: number, gameId: number): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      player => player.userId === userId && player.gameId === gameId
    );
  }
  
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.playerCurrentId++;
    const player: Player = { 
      ...insertPlayer, 
      id, 
      markedNumbers: [], 
      hasBingo: false 
    };
    this.players.set(id, player);
    return player;
  }
  
  async markNumber(playerId: number, number: number): Promise<Player | undefined> {
    const player = await this.getPlayer(playerId);
    if (!player) return undefined;
    
    // Only mark if the number is on the player's card
    const isOnCard = player.cardNumbers.some(row => 
      row.includes(number)
    );
    
    if (!isOnCard) return player;
    
    const markedNumbers = [...player.markedNumbers, number];
    const updatedPlayer = { ...player, markedNumbers };
    this.players.set(playerId, updatedPlayer);
    return updatedPlayer;
  }
  
  async claimBingo(playerId: number): Promise<Player | undefined> {
    const player = await this.getPlayer(playerId);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, hasBingo: true };
    this.players.set(playerId, updatedPlayer);
    return updatedPlayer;
  }
}

export const storage = new MemStorage();
