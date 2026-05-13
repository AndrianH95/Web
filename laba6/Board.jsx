import Square from './Square';

export default function Board({ squares, onPlay, winningLine, canClick, userSide }) {
  function handleClick(i) {
    if (!canClick || squares[i]) return;
    const nextSquares = squares.slice();
    nextSquares[i] = userSide;
    onPlay(nextSquares);
  }

  return (
    <div className="board">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Square 
          key={i}
          value={squares[i]} 
          onSquareClick={() => handleClick(i)} 
          isWinningSquare={winningLine && winningLine.includes(i)}
        />
      ))}
    </div>
  );
}

export function calculateWinner(squares) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  return { winner: null, line: null };
}