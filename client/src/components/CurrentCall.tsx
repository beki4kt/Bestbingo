import React from 'react';
import { formatBingoNumber } from '@/lib/gameUtils';

interface CurrentCallProps {
  number: number | null;
  countdown: number;
}

const CurrentCall: React.FC<CurrentCallProps> = ({ number, countdown }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center gap-2">
      <div className="text-sm font-medium">Current Call</div>
      <div className="bg-[#FF7F50] rounded-full h-16 w-16 flex items-center justify-center animate-pulse">
        <span className="font-bold text-2xl">
          {formatBingoNumber(number)}
        </span>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 w-full flex justify-between items-center mt-2">
        <span className="text-sm font-medium">Count Down</span>
        <span className="font-bold text-xl animate-pulse">{countdown}</span>
      </div>
    </div>
  );
};

export default CurrentCall;
