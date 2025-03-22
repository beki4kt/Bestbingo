import React from 'react';

interface NumberGridProps {
  selectedNumbers: number[];
  onSelectNumber: (number: number) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ selectedNumbers, onSelectNumber }) => {
  // Create an array of numbers from 1 to 100
  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
  
  return (
    <div className="grid grid-cols-10 gap-2">
      {numbers.map(number => (
        <button
          key={number}
          className={`${
            selectedNumbers.includes(number) 
              ? 'bg-green-500 text-white' 
              : 'bg-bingo-purple-light text-gray-700 hover:bg-white hover:text-bingo-purple-dark'
          } rounded-lg h-9 w-full flex items-center justify-center font-medium transition-colors`}
          onClick={() => onSelectNumber(number)}
        >
          {number}
        </button>
      ))}
    </div>
  );
};

export default NumberGrid;
