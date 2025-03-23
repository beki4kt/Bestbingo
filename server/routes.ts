import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { wsMessageSchema, type WSMessage } from "@shared/schema";
import { generateGameId, generateBingoCard, checkBingo } from "../shared/gameUtils";

// Store active game intervals to clear them when games end
const gameIntervals: Map<number, NodeJS.Timeout> = new Map();
// Store connected clients
const clients: Map<WebSocket, { userId?: number, gameId?: number }> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws) => {
    console.log('Client connected');
    clients.set(ws, {});
    
    // Send active games count when a client connects
    const activeGames = await storage.getActiveGames();
    
    // Make sure the client is still connected before sending
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'GAME_UPDATED',
        payload: { activeGames: activeGames.length }
      }));
    }
    
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const result = wsMessageSchema.safeParse(parsedMessage);
        
        if (!result.success) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: { message: 'Invalid message format' }
          }));
          return;
        }
        
        const data = result.data as WSMessage;
        
        switch (data.type) {
          case 'JOIN_GAME':
            await handleJoinGame(ws, data.payload);
            break;
            
          case 'LEAVE_GAME':
            await handleLeaveGame(ws);
            break;
            
          case 'START_GAME':
            await handleStartGame(data.payload);
            break;
            
          case 'MARK_NUMBER':
            await handleMarkNumber(ws, data.payload);
            break;
            
          case 'CLAIM_BINGO':
            await handleClaimBingo(ws);
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Unknown message type' }
            }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Failed to process message' }
        }));
      }
    });
    
    ws.on('close', () => {
      const clientData = clients.get(ws);
      if (clientData && clientData.gameId) {
        handleLeaveGame(ws);
      }
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });
  
  // API Routes
  app.get('/api/games/active', async (req, res) => {
    try {
      const activeGames = await storage.getActiveGames();
      res.json({ count: activeGames.length });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get active games' });
    }
  });
  
  app.post('/api/users', async (req, res) => {
    try {
      const username = `player${Math.floor(Math.random() * 10000)}`;
      const password = `pass${Math.floor(Math.random() * 10000)}`;
      const user = await storage.createUser({ username, password });
      res.json({ id: user.id, username: user.username, wallet: user.wallet / 100 });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  return httpServer;
}

// WebSocket handlers
async function handleJoinGame(ws: WebSocket, payload: any) {
  try {
    const { userId, stake = 1000 } = payload; // Default stake is 10.00
    
    // Create or get user
    let user;
    if (userId) {
      user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
    } else {
      const username = `player${Math.floor(Math.random() * 10000)}`;
      const password = `pass${Math.floor(Math.random() * 10000)}`;
      user = await storage.createUser({ username, password });
    }
    
    // Check if user has enough funds
    if (user.wallet < stake) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Insufficient funds' }
      }));
      return;
    }
    
    // Deduct stake from wallet
    await storage.updateUserWallet(user.id, -stake);
    
    // Create a new game or find an existing one with fewer than 100 players
    const activeGames = await storage.getActiveGames();
    let game;
    
    if (activeGames.length > 0) {
      const availableGame = activeGames[0]; // Just use the first active game for simplicity
      const players = await storage.getPlayersByGameId(availableGame.id);
      
      if (players.length < 100) {
        game = availableGame;
      }
    }
    
    if (!game) {
      // Create a new game
      const gameId = generateGameId();
      game = await storage.createGame({ gameId, stake });
    }
    
    // Generate a bingo card
    const boardNumber = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
    const cardNumbers = generateBingoCard();
    
    // Create player
    const player = await storage.createPlayer({
      userId: user.id,
      gameId: game.id,
      cardNumbers,
      boardNumber
    });
    
    // Update client data
    clients.set(ws, { userId: user.id, gameId: game.id });
    
    // Send game info to the client
    ws.send(JSON.stringify({
      type: 'JOIN_GAME',
      payload: {
        gameId: game.gameId,
        userId: user.id,
        playerId: player.id,
        cardNumbers,
        boardNumber,
        wallet: user.wallet / 100, // Convert to dollars
        stake: game.stake / 100,
        playerCount: (await storage.getPlayersByGameId(game.id)).length,
        calledNumbers: game.calledNumbers,
        currentCall: game.currentCall,
        countdown: game.countdown
      }
    }));
    
    // Broadcast updated player count to all clients in the game
    broadcastToGame(game.id, {
      type: 'GAME_UPDATED',
      payload: {
        playerCount: (await storage.getPlayersByGameId(game.id)).length,
        gameId: game.gameId
      }
    });
    
    // Send active games count to all clients
    broadcastToAll({
      type: 'GAME_UPDATED',
      payload: { activeGames: (await storage.getActiveGames()).length }
    });
    
  } catch (error) {
    console.error('Error joining game:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to join game' }
    }));
  }
}

async function handleLeaveGame(ws: WebSocket) {
  try {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.gameId || !clientData.userId) return;
    
    const { userId, gameId } = clientData;
    
    // Get game
    const game = await storage.getGame(gameId);
    if (!game) return;
    
    // Get player
    const player = await storage.getPlayerByUserAndGame(userId, gameId);
    if (!player) return;
    
    // Clear client data
    clients.set(ws, {});
    
    // Broadcast updated player count
    broadcastToGame(gameId, {
      type: 'GAME_UPDATED',
      payload: {
        playerCount: (await storage.getPlayersByGameId(gameId)).length - 1,
        gameId: game.gameId
      }
    });
    
    // Check if game should end (no players left)
    const players = await storage.getPlayersByGameId(gameId);
    if (players.length <= 1) { // Just the leaving player
      await endGame(gameId);
    }
    
    // Notify client
    ws.send(JSON.stringify({
      type: 'LEAVE_GAME',
      payload: { success: true }
    }));
    
  } catch (error) {
    console.error('Error leaving game:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to leave game' }
    }));
  }
}

async function handleStartGame(payload: any) {
  try {
    const { gameId } = payload;
    if (!gameId) return;
    
    // Get game
    const game = await storage.getGameByGameId(gameId);
    if (!game || !game.active) return;
    
    // Start calling numbers
    startNumberCalling(game.id);
    
    // Broadcast game start
    broadcastToGame(game.id, {
      type: 'START_GAME',
      payload: { gameId: game.gameId }
    });
    
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

async function handleMarkNumber(ws: WebSocket, payload: any) {
  try {
    const { number } = payload;
    const clientData = clients.get(ws);
    if (!clientData || !clientData.gameId || !clientData.userId) return;
    
    const { userId, gameId } = clientData;
    
    // Get player
    const player = await storage.getPlayerByUserAndGame(userId, gameId);
    if (!player) return;
    
    // Get game
    const game = await storage.getGame(gameId);
    if (!game || !game.active) return;
    
    // Check if number has been called
    if (!game.calledNumbers.includes(number)) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Number has not been called yet' }
      }));
      return;
    }
    
    // Mark number
    await storage.markNumber(player.id, number);
    
    // Send updated player data
    const updatedPlayer = await storage.getPlayer(player.id);
    ws.send(JSON.stringify({
      type: 'MARK_NUMBER',
      payload: {
        markedNumbers: updatedPlayer?.markedNumbers || []
      }
    }));
    
  } catch (error) {
    console.error('Error marking number:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to mark number' }
    }));
  }
}

async function handleClaimBingo(ws: WebSocket) {
  try {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.gameId || !clientData.userId) return;
    
    const { userId, gameId } = clientData;
    
    // Get player
    const player = await storage.getPlayerByUserAndGame(userId, gameId);
    if (!player) return;
    
    // Get game
    const game = await storage.getGame(gameId);
    if (!game || !game.active) return;
    
    // Verify bingo claim
    const isBingo = checkBingo(player.cardNumbers, player.markedNumbers);
    
    if (isBingo) {
      // Mark player as winner
      await storage.claimBingo(player.id);
      
      // Award winnings
      const players = await storage.getPlayersByGameId(gameId);
      const pot = game.stake * players.length;
      await storage.updateUserWallet(userId, pot); // Winner gets the whole pot
      
      // End the game
      await endGame(gameId);
      
      // Notify winner
      ws.send(JSON.stringify({
        type: 'CLAIM_BINGO',
        payload: {
          success: true,
          message: 'Bingo confirmed! You won!',
          winnings: pot / 100 // Convert to dollars
        }
      }));
      
      // Notify other players
      broadcastToGame(gameId, {
        type: 'GAME_ENDED',
        payload: {
          gameId: game.gameId,
          winnerId: userId,
          message: 'Game ended - another player got BINGO!'
        }
      }, [ws]); // Exclude winner from broadcast
      
    } else {
      ws.send(JSON.stringify({
        type: 'CLAIM_BINGO',
        payload: {
          success: false,
          message: 'Invalid BINGO claim!'
        }
      }));
    }
    
  } catch (error) {
    console.error('Error claiming bingo:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to process bingo claim' }
    }));
  }
}

// Helper functions
function startNumberCalling(gameId: number) {
  // Clear existing interval if any
  if (gameIntervals.has(gameId)) {
    clearInterval(gameIntervals.get(gameId));
  }
  
  const interval = setInterval(async () => {
    try {
      // Get game with current state
      const game = await storage.getGame(gameId);
      if (!game || !game.active) {
        clearInterval(interval);
        return;
      }
      
      // Get current state from the game
      let countdown = game.countdown - 1;
      let calledNumbers = [...game.calledNumbers];
      
      // Call a number every 5 seconds
      if (countdown % 5 === 0 && countdown > 0) {
        // Generate a new number that hasn't been called yet
        let number;
        do {
          number = Math.floor(Math.random() * 75) + 1; // 1-75 for BINGO
        } while (calledNumbers.includes(number));
        
        calledNumbers.push(number);
        
        // Update game with new called number
        await storage.updateGameCall(gameId, number, countdown);
        
        // Broadcast the called number
        broadcastToGame(gameId, {
          type: 'NUMBER_CALLED',
          payload: {
            number,
            countdown,
            calledNumbers
          }
        });
        
        console.log(`Game ${game.gameId}: Called ${number}, countdown: ${countdown}, total called: ${calledNumbers.length}`);
      } else if (countdown > 0) {
        // Update game countdown in storage
        await storage.updateGameCall(gameId, game.currentCall || 0, countdown);
        
        // Broadcast countdown update
        broadcastToGame(gameId, {
          type: 'GAME_UPDATED',
          payload: { countdown }
        });
      }
      
      // End game if countdown reaches 0
      if (countdown <= 0) {
        console.log(`Game ${game.gameId}: Countdown reached 0, ending game.`);
        await endGame(gameId);
      }
    } catch (error) {
      console.error('Error in number calling interval:', error);
      clearInterval(interval);
    }
  }, 1000);
  
  gameIntervals.set(gameId, interval);
}

async function endGame(gameId: number) {
  try {
    // Clear interval
    if (gameIntervals.has(gameId)) {
      clearInterval(gameIntervals.get(gameId));
      gameIntervals.delete(gameId);
    }
    
    // End game
    await storage.endGame(gameId);
    
    // Broadcast game end
    const game = await storage.getGame(gameId);
    if (!game) return;
    
    broadcastToGame(gameId, {
      type: 'GAME_ENDED',
      payload: {
        gameId: game.gameId,
        message: 'Game ended!'
      }
    });
    
    // Update active games count
    broadcastToAll({
      type: 'GAME_UPDATED',
      payload: { activeGames: (await storage.getActiveGames()).length }
    });
    
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

function broadcastToGame(gameId: number, message: WSMessage, exclude: WebSocket[] = []) {
  // Convert Map entries to array to fix iterator issues
  Array.from(clients.entries()).forEach(([client, data]) => {
    if (data.gameId === gameId && client.readyState === WebSocket.OPEN && !exclude.includes(client)) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastToAll(message: WSMessage) {
  // Convert Map entries to array to fix iterator issues
  Array.from(clients.entries()).forEach(([client, _]) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
