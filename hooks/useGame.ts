import { useState, useEffect } from 'react';
import { CellState, GameState, UserStats } from '../types/game';

const BOARD_SIZE = 10;
const MINE_COUNT = 20;
const GAME_DURATION = 180;

export function useGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    gameOver: false,
    won: false,
    started: false,
    remainingMines: MINE_COUNT,
    time: GAME_DURATION,
    score: 0
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('minesweeper_stats');
      return savedStats ? JSON.parse(savedStats) : {
        xp: 100,
        gamesPlayed: 0,
        gamesWon: 0
      };
    }
    return {
      xp: 100,
      gamesPlayed: 0,
      gamesWon: 0
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('minesweeper_stats', JSON.stringify(userStats));
    }
  }, [userStats]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.started && !gameState.gameOver) {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.time <= 0) {
            return {
              ...prev,
              gameOver: true,
              won: false,
              time: 0
            };
          }
          return { ...prev, time: prev.time - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.started, gameState.gameOver]);

  const initializeBoard = () => {
    const newBoard: CellState[][] = Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => ({
            isRevealed: false,
            isFlagged: false,
            hasMine: false,
            adjacentMines: 0
          }))
      );

    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (!newBoard[row][col].hasMine) {
        newBoard[row][col].hasMine = true;
        minesPlaced++;
      }
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!newBoard[row][col].hasMine) {
          let count = 0;
          for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
              if (r === 0 && c === 0) continue;
              const newRow = row + r;
              const newCol = col + c;
              if (
                newRow >= 0 &&
                newRow < BOARD_SIZE &&
                newCol >= 0 &&
                newCol < BOARD_SIZE &&
                newBoard[newRow][newCol].hasMine
              ) {
                count++;
              }
            }
          }
          newBoard[row][col].adjacentMines = count;
        }
      }
    }

    return newBoard;
  };

  const calculateScore = (revealedCells: number, totalCells: number, time: number) => {
    const baseScore = Math.floor((revealedCells / totalCells) * 1000);
    const timeBonus = Math.max(0, 1000 - time * 10);
    const totalScore = Math.floor((baseScore + timeBonus) / 10);
    return totalScore;
  };

  const revealAdjacentCells = (row: number, col: number, board: CellState[][]) => {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 &&
          newRow < board.length &&
          newCol >= 0 &&
          newCol < board[0].length &&
          !board[newRow][newCol].isRevealed &&
          !board[newRow][newCol].isFlagged
        ) {
          board[newRow][newCol] = { ...board[newRow][newCol], isRevealed: true };
          if (board[newRow][newCol].adjacentMines === 0) {
            revealAdjacentCells(newRow, newCol, board);
          }
        }
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameOver) return;

    const cell = gameState.board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    const newBoard = [...gameState.board];
    newBoard[row][col] = { ...cell, isRevealed: true };

    if (cell.hasMine) {
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        gameOver: true,
        won: false
      }));
      return;
    }

    if (cell.adjacentMines === 0) {
      revealAdjacentCells(row, col, newBoard);
    }

    const revealedCells = newBoard.flat().filter(cell => cell.isRevealed).length;
    const totalCells = gameState.board.length * gameState.board[0].length;
    const remainingMines = gameState.board.flat().filter(cell => cell.hasMine && !cell.isFlagged).length;

    const isGameWon = revealedCells === totalCells - gameState.board.flat().filter(cell => cell.hasMine).length;
    if (isGameWon) {
      const score = calculateScore(revealedCells, totalCells, gameState.time);
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        gameOver: true,
        won: true,
        score
      }));
      setUserStats((prev: UserStats) => ({
        ...prev,
        xp: prev.xp + score,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        remainingMines
      }));
    }
  };

  const handleCellRightClick = (row: number, col: number) => {
    if (gameState.gameOver || gameState.board[row][col].isRevealed) return;

    const newBoard = [...gameState.board];
    const cell = newBoard[row][col];

    if (cell.isFlagged) {
      cell.isFlagged = false;
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        remainingMines: prev.remainingMines + 1,
      }));
    } else {
      cell.isFlagged = true;
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        remainingMines: prev.remainingMines - 1,
      }));
    }
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      board: initializeBoard(),
      gameOver: false,
      won: false,
      started: true,
      remainingMines: MINE_COUNT,
      time: GAME_DURATION,
      score: 0
    }));
  };

  return {
    gameState,
    userStats,
    startGame,
    handleCellClick,
    handleCellRightClick,
    setGameState
  };
} 
