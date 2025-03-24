import React from 'react';

interface BingoCardProps {
  numbers: number[][];
  markedNumbers: number[];
  calledNumbers: number[];
  boardNumber: number;
  onMarkNumber: (number: number) => void;
}

const BingoCard: React.FC<BingoCardProps> = ({ 
  numbers, 
  markedNumbers, 
  calledNumbers,
  boardNumber,
  onMarkNumber 
}) => {
  // BINGO letters
  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];
  
  // Check if a number is marked
  const isMarked = (number: number) => {
    return number === 0 || markedNumbers.includes(number);
  };
  
  // Check if a number can be marked (has been called)
  const canBeMarked = (number: number) => {
    return number === 0 || calledNumbers.includes(number);
  };
  
  // Format the grid data
  const gridData = [];
  for (let row = 0; row < 5; row++) {
    const rowData = [];
    for (let col = 0; col < 5; col++) {
      rowData.push(numbers[col][row]);
    }
    gridData.push(rowData);
  }
  
  return (
    <div className="w-full">
      {/* BINGO header */}
      <div className="grid grid-cols-5 gap-1 mb-1">
        {bingoLetters.map((letter, index) => (
          <div
            key={letter}
            className={`text-white font-bold rounded text-center py-1 text-sm
              ${index === 0 ? 'bg-yellow-500' : ''}
              ${index === 1 ? 'bg-teal-500' : ''}
              ${index === 2 ? 'bg-blue-500' : ''}
              ${index === 3 ? 'bg-green-500' : ''}
              ${index === 4 ? 'bg-red-500' : ''}
            `}
          >
            {letter}
          </div>
        ))}
      </div>
      
      {/* Bingo card grid */}
      <div className="grid grid-cols-5 gap-1">
        {gridData.map((row, rowIndex) => (
          row.map((number, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`
                rounded py-2 text-center
                ${isMarked(number) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-bingo-purple-light text-gray-700'}
                ${canBeMarked(number) && !isMarked(number) 
                  ? 'hover:bg-green-400 hover:text-white' 
                  : ''}
              `}
              onClick={() => canBeMarked(number) && onMarkNumber(number)}
              disabled={!canBeMarked(number) || isMarked(number)}
            >
              {number === 0 ? 'FREE' : number}
            </button>
          ))
        ))}
      </div>
      
      <div className="text-center text-xs mt-1 text-white/70">
        Board number {boardNumber}
      </div>
    </div>
  );
};

export default BingoCard;
