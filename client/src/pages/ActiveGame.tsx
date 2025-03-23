import React, { useEffect } from 'react';
import Header from '@/components/Header';
import BingoCard from '@/components/BingoCard';
import ReferenceBoard from '@/components/ReferenceBoard';
import CurrentCall from '@/components/CurrentCall';
import { useGameContext } from '@/context/GameContext';
import { Button } from '@/components/ui/button';

const ActiveGame: React.FC = () => {
  const { 
    game, 
    card, 
    leaveGame, 
    markNumber, 
    claimBingo,
    startGame
  } = useGameContext();
  
  // Start the game if this is the first player
  useEffect(() => {
    if (game && game.playerCount === 1) {
      startGame();
    }
  }, [game, startGame]);
  
  if (!game || !card) {
    return <div>Loading game...</div>;
  }
  
  const handleLeave = () => {
    leaveGame();
  };
  
  const handleBingo = () => {
    claimBingo();
  };
  
  const handleRefresh = () => {
    // Just refresh the browser for now
    window.location.reload();
  };
  
  return (
    <div className="space-y-4">
      <Header onClose={handleLeave} />
      
      {/* Game Info Bar */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">Game</span>
          <span className="font-bold text-sm">{game.gameId}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">Derash</span>
          <span className="font-bold text-sm">-</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">Bonus</span>
          <span className="font-bold text-sm">-</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">Players</span>
          <span className="font-bold text-sm">{game.playerCount}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">Bet</span>
          <span className="font-bold text-sm">${game.stake.toFixed(2)}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center">
          <span className="text-xs">call</span>
          <span className="font-bold text-sm">{game.calledNumbers.length}</span>
        </div>
      </div>
      
      <div className="flex gap-4">
        {/* Left Side: Reference Board */}
        <div className="w-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
          {/* BINGO Letters */}
          <div className="grid grid-cols-5 gap-1 mb-1">
            <div className="bg-yellow-500 text-white font-bold rounded text-center py-1">B</div>
            <div className="bg-teal-500 text-white font-bold rounded text-center py-1">I</div>
            <div className="bg-blue-500 text-white font-bold rounded text-center py-1">N</div>
            <div className="bg-green-500 text-white font-bold rounded text-center py-1">G</div>
            <div className="bg-red-500 text-white font-bold rounded text-center py-1">O</div>
          </div>
          
          {/* Reference Board */}
          <ReferenceBoard calledNumbers={game.calledNumbers} />
        </div>
        
        {/* Right Side: Current Call and Bingo Card */}
        <div className="w-1/2 flex flex-col gap-2">
          {/* Current Call with Countdown */}
          <CurrentCall 
            number={game.currentCall || null} 
            countdown={game.countdown} 
          />
          
          {/* Bingo Card */}
          <BingoCard 
            numbers={card.numbers}
            markedNumbers={card.markedNumbers}
            calledNumbers={game.calledNumbers}
            boardNumber={game.boardNumber}
            onMarkNumber={markNumber}
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3 mt-4">
        <Button
          className="w-full bg-[#FF7F50] text-white font-bold py-3 rounded-full hover:bg-[#FF7F50]/90 transition-colors shadow-lg"
          onClick={handleBingo}
        >
          BINGO!
        </Button>
        
        <div className="flex justify-between gap-4">
          <Button
            className="flex-1 bg-[#38B6FF] text-white font-bold py-3 rounded-full hover:bg-[#38B6FF]/90 transition-colors shadow-lg"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            className="flex-1 bg-[#FF5757] text-white font-bold py-3 rounded-full hover:bg-[#FF5757]/90 transition-colors shadow-lg"
            onClick={handleLeave}
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveGame;
