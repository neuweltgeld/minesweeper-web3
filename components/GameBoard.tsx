import { CellState } from '../types/game';

interface GameBoardProps {
  board: CellState[][];
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
}

export function GameBoard({ board, onCellClick, onCellRightClick }: GameBoardProps) {
  const isDevelopment = false; // Mayınları gösterme

  const getNumberColor = (number: number) => {
    switch (number) {
      case 1: return 'blue';
      case 2: return 'green';
      case 3: return 'red';
      case 4: return 'purple';
      case 5: return 'yellow';
      case 6: return 'cyan';
      case 7: return 'black';
      case 8: return 'gray';
      default: return 'white';
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border-4 border-purple-500/50 backdrop-blur-sm">
      <div className="grid grid-cols-10 gap-1.5 aspect-square">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onContextMenu={(e) => {
                e.preventDefault();
                onCellRightClick(rowIndex, colIndex);
              }}
              className={`
                aspect-square w-full flex items-center justify-center text-sm font-bold font-pixel
                ${cell.isRevealed
                  ? cell.hasMine
                    ? 'bg-red-500/80 hover:bg-red-600/80'
                    : 'bg-gray-700/80 hover:bg-gray-600/80'
                  : 'bg-gray-600/80 hover:bg-gray-500/80'
                }
                ${cell.isFlagged ? 'text-red-500' : ''}
                ${cell.isRevealed && !cell.hasMine && cell.adjacentMines > 0
                  ? `text-${getNumberColor(cell.adjacentMines)}-400`
                  : ''
                }
                transition-all duration-200
                rounded-md
                shadow-md
                hover:shadow-lg
                hover:scale-105
                border border-gray-500/30
              `}
            >
              {cell.isRevealed
                ? cell.hasMine
                  ? '💣'
                  : cell.adjacentMines > 0
                    ? cell.adjacentMines
                    : ''
                : cell.isFlagged
                  ? '🚩'
                  : ''
              }
            </button>
          ))
        )}
      </div>
    </div>
  );
} 