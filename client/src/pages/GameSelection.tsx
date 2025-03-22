import React from 'react';
import Header from '@/components/Header';
import GameStatusBar from '@/components/GameStatusBar';
import NumberGrid from '@/components/NumberGrid';
import { useGameContext } from '@/context/GameContext';
import { Button } from '@/components/ui/button';

const GameSelection: React.FC = () => {
  const { 
    user, 
    activeGames, 
    selectedNumbers, 
    selectNumber, 
    joinGame,
    isLoading 
  } = useGameContext();
  
  const walletBalance = user?.wallet || 0;
  const stake = 10; // Default stake
  
  const handleStartGame = () => {
    joinGame(stake);
  };
  
  const handleRefresh = () => {
    // Reset selected numbers or refresh game state
    window.location.reload();
  };
  
  return (
    <div className="space-y-4">
      <Header />
      
      <GameStatusBar 
        walletBalance={walletBalance}
        activeGames={activeGames}
        stake={stake}
      />
      
      <NumberGrid 
        selectedNumbers={selectedNumbers}
        onSelectNumber={selectNumber}
      />
      
      <div className="flex justify-center gap-4 mt-6">
        <Button
          className="bg-[#38B6FF] text-white font-bold py-3 px-8 rounded-full hover:bg-[#38B6FF]/90 transition-colors shadow-lg"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button
          className="bg-[#FF7F50] text-white font-bold py-3 px-8 rounded-full hover:bg-[#FF7F50]/90 transition-colors shadow-lg"
          onClick={handleStartGame}
          disabled={isLoading}
        >
          {isLoading ? 'Joining...' : 'Start game'}
        </Button>
      </div>
    </div>
  );
};

export default GameSelection;
