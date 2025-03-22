import React from 'react';

interface GameStatusBarProps {
  walletBalance: number;
  activeGames: number;
  stake: number;
}

const GameStatusBar: React.FC<GameStatusBarProps> = ({ walletBalance, activeGames, stake }) => {
  return (
    <div className="flex justify-between gap-3 mb-6">
      <div className="bg-white/20 backdrop-blur-sm rounded-full flex-1 py-2 flex flex-col items-center">
        <span className="text-sm font-medium">Wallet</span>
        <span className="font-bold">{walletBalance.toFixed(2)}</span>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-full flex-1 py-2 flex flex-col items-center">
        <span className="text-sm font-medium">Active Game</span>
        <span className="font-bold">{activeGames}</span>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-full flex-1 py-2 flex flex-col items-center">
        <span className="text-sm font-medium">Stake</span>
        <span className="font-bold">{stake}</span>
      </div>
    </div>
  );
};

export default GameStatusBar;
