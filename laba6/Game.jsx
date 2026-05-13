import { useState, useEffect } from 'react';
import Board, { calculateWinner } from './Board';

export default function Game() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true); // X завжди ходить першим
  const [userSide, setUserSide] = useState(null); // 'X' або 'O'
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('ttt-pro-stats');
    return saved ? JSON.parse(saved) : { x: 0, o: 0, ties: 0 };
  });

  const { winner, line: winningLine } = calculateWinner(squares);
  const isTie = !winner && squares.every(s => s !== null);

  // Логіка ходу комп'ютера
  useEffect(() => {
    const computerSide = userSide === 'X' ? 'O' : 'X';
    const isComputerTurn = (xIsNext && computerSide === 'X') || (!xIsNext && computerSide === 'O');

    if (userSide && isComputerTurn && !winner && !isTie) {
      const timer = setTimeout(() => {
        const nullIndices = squares.map((v, i) => v === null ? i : null).filter(v => v !== null);
        if (nullIndices.length > 0) {
          const randomIndex = nullIndices[Math.floor(Math.random() * nullIndices.length)];
          const nextSquares = squares.slice();
          nextSquares[randomIndex] = computerSide;
          setSquares(nextSquares);
          setXIsNext(!xIsNext);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, winner, isTie, squares, userSide]);

  // Статистика
  useEffect(() => {
    if (winner) {
      const newStats = { ...stats, [winner.toLowerCase()]: stats[winner.toLowerCase()] + 1 };
      setStats(newStats);
      localStorage.setItem('ttt-pro-stats', JSON.stringify(newStats));
    } else if (isTie) {
      const newStats = { ...stats, ties: stats.ties + 1 };
      setStats(newStats);
      localStorage.setItem('ttt-pro-stats', JSON.stringify(newStats));
    }
  }, [winner, isTie]);

  function handlePlay(nextSquares) {
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  function resetGame() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setUserSide(null); // Повертаємо до вибору сторони
  }

  // Екран вибору сторони
  if (!userSide) {
    return (
      <div className="game-setup">
        <h1>Tic-Tac-Toe</h1>
        <p>Оберіть свою сторону:</p>
        <div className="setup-buttons">
          <button className="btn-choice x-btn" onClick={() => setUserSide('X')}>Грати за X</button>
          <button className="btn-choice o-btn" onClick={() => setUserSide('O')}>Грати за O</button>
        </div>
        <div className="stats-preview">
          Перемоги X: {stats.x} | O: {stats.o} | Нічиї: {stats.ties}
        </div>
      </div>
    );
  }

  let status;
  if (winner) status = `Переміг: ${winner}! 🎉`;
  else if (isTie) status = "Нічия! 🤝";
  else status = xIsNext ? "Хід X" : "Хід O";

  return (
    <div className="game">
      <div className="game-header">
        <div className={`status-banner ${winner ? 'win' : isTie ? 'tie' : ''}`}>
          {status}
        </div>
      </div>

      <Board 
        squares={squares} 
        onPlay={handlePlay} 
        winningLine={winningLine} 
        canClick={!winner && !isTie && ((xIsNext && userSide === 'X') || (!xIsNext && userSide === 'O'))}
        userSide={userSide}
      />

      <div className="game-footer">
        <button className="reset-btn" onClick={resetGame}>До меню</button>
        <button className="reset-btn secondary" onClick={() => {setSquares(Array(9).fill(null)); setXIsNext(true);}}>Очистити поле</button>
      </div>
    </div>
  );
}