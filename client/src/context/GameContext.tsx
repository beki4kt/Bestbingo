import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket from '@/hooks/useWebSocket';
import { GameInfo, BingoCard, UserInfo } from '@/types/game';
import { generateBingoCard } from '@/lib/gameUtils';

interface GameContextType {
  isConnected: boolean;
  connectionError: string | null;
  user: UserInfo | null;
  game: GameInfo | null;
  card: BingoCard | null;
  activeGames: number;
  selectedNumbers: number[];
  isLoading: boolean;
  isGameActive: boolean;
  errorMessage: string | null;
  
  // Actions
  joinGame: (stake?: number) => void;
  leaveGame: () => void;
  startGame: () => void;
  selectNumber: (number: number) => void;
  markNumber: (number: number) => void;
  claimBingo: () => void;
}

const defaultGameContext: GameContextType = {
  isConnected: false,
  connectionError: null,
  user: null,
  game: null,
  card: null,
  activeGames: 0,
  selectedNumbers: [],
  isLoading: false,
  isGameActive: false,
  errorMessage: null,
  
  joinGame: () => {},
  leaveGame: () => {},
  startGame: () => {},
  selectNumber: () => {},
  markNumber: () => {},
  claimBingo: () => {},
};

const GameContext = createContext<GameContextType>(defaultGameContext);

export const useGameContext = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, error: connectionError, sendMessage, addMessageListener } = useWebSocket();
  
  const [user, setUser] = useState<UserInfo | null>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [card, setCard] = useState<BingoCard | null>(null);
  const [activeGames, setActiveGames] = useState<number>(0);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Compute if we're in an active game
  const isGameActive = Boolean(game);
  
  useEffect(() => {
    // Automatically create a user when connected
    if (isConnected && !user) {
      fetch('/api/users', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setUser({
            userId: data.id,
            username: data.username,
            wallet: data.wallet
          });
        })
        .catch(err => {
          console.error('Failed to create user:', err);
          setErrorMessage('Failed to initialize user');
        });
    }
    
    // Listen for active games updates
    const removeGameUpdatedListener = addMessageListener('GAME_UPDATED', (payload) => {
      if (payload.activeGames !== undefined) {
        setActiveGames(payload.activeGames);
      }
      
      if (payload.countdown !== undefined && game) {
        setGame(prevGame => prevGame ? { ...prevGame, countdown: payload.countdown } : null);
      }
      
      if (payload.playerCount !== undefined && game) {
        setGame(prevGame => prevGame ? { ...prevGame, playerCount: payload.playerCount } : null);
      }
    });
    
    // Listen for game join responses
    const removeJoinListener = addMessageListener('JOIN_GAME', (payload) => {
      setIsLoading(false);
      
      if (payload.userId && payload.gameId) {
        // Update user info
        if (user) {
          setUser({ ...user, wallet: payload.wallet });
        }
        
        // Set game info
        setGame({
          gameId: payload.gameId,
          playerCount: payload.playerCount,
          stake: payload.stake,
          countdown: payload.countdown,
          currentCall: payload.currentCall,
          calledNumbers: payload.calledNumbers || [],
          boardNumber: payload.boardNumber
        });
        
        // Set bingo card
        setCard({
          numbers: payload.cardNumbers,
          markedNumbers: []
        });
      }
    });
    
    // Listen for number calls
    const removeNumberCalledListener = addMessageListener('NUMBER_CALLED', (payload) => {
      if (game) {
        setGame(prevGame => {
          if (!prevGame) return null;
          return {
            ...prevGame,
            currentCall: payload.number,
            calledNumbers: payload.calledNumbers,
            countdown: payload.countdown
          };
        });
      }
    });
    
    // Listen for mark number responses
    const removeMarkNumberListener = addMessageListener('MARK_NUMBER', (payload) => {
      setCard(prevCard => {
        if (!prevCard) return null;
        return {
          ...prevCard,
          markedNumbers: payload.markedNumbers
        };
      });
    });
    
    // Listen for bingo claims
    const removeClaimBingoListener = addMessageListener('CLAIM_BINGO', (payload) => {
      if (payload.success) {
        alert(`${payload.message} You won $${payload.winnings.toFixed(2)}!`);
        
        // Update wallet
        if (user && payload.winnings) {
          setUser(prevUser => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              wallet: prevUser.wallet + payload.winnings
            };
          });
        }
        
        // Reset game state
        setGame(null);
        setCard(null);
      } else {
        alert(payload.message);
      }
    });
    
    // Listen for game end
    const removeGameEndedListener = addMessageListener('GAME_ENDED', (payload) => {
      alert(payload.message);
      
      // Reset game state
      setGame(null);
      setCard(null);
    });
    
    // Listen for leave game responses
    const removeLeaveGameListener = addMessageListener('LEAVE_GAME', () => {
      // Reset game state
      setGame(null);
      setCard(null);
    });
    
    // Listen for errors
    const removeErrorListener = addMessageListener('ERROR', (payload) => {
      setIsLoading(false);
      setErrorMessage(payload.message);
      setTimeout(() => setErrorMessage(null), 3000);
    });
    
    return () => {
      removeGameUpdatedListener();
      removeJoinListener();
      removeNumberCalledListener();
      removeMarkNumberListener();
      removeClaimBingoListener();
      removeGameEndedListener();
      removeLeaveGameListener();
      removeErrorListener();
    };
  }, [isConnected, user, game, addMessageListener]);
  
  // Join a game
  const joinGame = (stake = 10) => {
    if (!isConnected || !user) {
      setErrorMessage('Not connected to game server');
      return;
    }
    
    setIsLoading(true);
    sendMessage('JOIN_GAME', { 
      userId: user.userId,
      stake: stake * 100 // Convert to cents
    });
  };
  
  // Leave the current game
  const leaveGame = () => {
    if (!isConnected || !game) return;
    
    sendMessage('LEAVE_GAME', {});
  };
  
  // Start the game
  const startGame = () => {
    if (!isConnected || !game) return;
    
    sendMessage('START_GAME', { gameId: game.gameId });
  };
  
  // Toggle number selection (for game creation)
  const selectNumber = (number: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };
  
  // Mark a number on the bingo card
  const markNumber = (number: number) => {
    if (!isConnected || !game) return;
    
    sendMessage('MARK_NUMBER', { number });
  };
  
  // Claim a bingo
  const claimBingo = () => {
    if (!isConnected || !game) return;
    
    sendMessage('CLAIM_BINGO', {});
  };
  
  const value: GameContextType = {
    isConnected,
    connectionError,
    user,
    game,
    card,
    activeGames,
    selectedNumbers,
    isLoading,
    isGameActive,
    errorMessage,
    
    joinGame,
    leaveGame,
    startGame,
    selectNumber,
    markNumber,
    claimBingo
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
