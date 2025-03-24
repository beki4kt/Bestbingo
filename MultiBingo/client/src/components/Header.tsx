import React from 'react';

interface HeaderProps {
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClose }) => {
  return (
    <header className="flex justify-between items-center mb-4">
      <button 
        className="text-white/90 text-lg hover:text-white transition"
        onClick={onClose}
      >
        Close
      </button>
      <div className="text-center">
        <h1 className="font-bold text-xl">Addis Bingo</h1>
        <p className="text-white/70 text-xs">mini app</p>
      </div>
      <button className="text-white/90 rounded-full p-1 hover:bg-white/10 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </header>
  );
};

export default Header;
