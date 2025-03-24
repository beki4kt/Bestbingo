import React from 'react';

interface ReferenceBoardProps {
  calledNumbers: number[];
}

const ReferenceBoard: React.FC<ReferenceBoardProps> = ({ calledNumbers }) => {
  // Generate the columns for B, I, N, G, O
  const bColumn = Array.from({ length: 15 }, (_, i) => i + 1);
  const iColumn = Array.from({ length: 15 }, (_, i) => i + 16);
  const nColumn = Array.from({ length: 15 }, (_, i) => i + 31);
  const gColumn = Array.from({ length: 15 }, (_, i) => i + 46);
  const oColumn = Array.from({ length: 15 }, (_, i) => i + 61);
  
  // Check if a number has been called
  const isNumberCalled = (num: number) => calledNumbers.includes(num);
  
  // Render a column
  const renderColumn = (numbers: number[]) => {
    return numbers.map((num) => (
      <div 
        key={num}
        className={`
          rounded py-1 text-center text-xs
          ${isNumberCalled(num) 
            ? 'bg-green-500 text-white' 
            : 'bg-bingo-purple-light text-gray-700'}
        `}
      >
        {num}
      </div>
    ));
  };
  
  return (
    <div className="grid grid-cols-5 gap-1 text-xs text-center">
      {renderColumn(bColumn)}
      {renderColumn(iColumn)}
      {renderColumn(nColumn)}
      {renderColumn(gColumn)}
      {renderColumn(oColumn)}
    </div>
  );
};

export default ReferenceBoard;
