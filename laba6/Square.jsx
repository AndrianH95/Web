import React from 'react';

export default function Square({ value, onSquareClick, isWinningSquare }) {
  return (
    <button 
      className={`square ${value === 'X' ? 'text-x' : 'text-o'} ${isWinningSquare ? 'winner-glow' : ''}`} 
      onClick={onSquareClick}
    >
      {value}
    </button>
  );
}