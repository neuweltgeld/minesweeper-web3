export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CellState {
  isRevealed: boolean;
  isFlagged: boolean;
  hasMine: boolean;
  adjacentMines: number;
}

export interface GameState {
  board: CellState[][];
  gameOver: boolean;
  won: boolean;
  started: boolean;
  remainingMines: number;
  time: number;
  score: number;
}

export interface GameConfig {
  size: number;
  mines: number;
}

export interface LeaderboardEntry {
  address: string;
  score: number;
  date: string;
}

export interface UserStats {
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
}

export const DIFFICULTY_CONFIGS = {
  easy: {
    rows: 9,
    cols: 9,
    mines: 10,
    scoreMultiplier: 1
  },
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
    scoreMultiplier: 2
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
    scoreMultiplier: 3
  }
};

export const POWER_UP_COSTS = {
  mineDetector: 50,
  extraFlag: 30,
  timeFreeze: 40
};

export const GAME_CONFIG: GameConfig = {
  size: 10,
  mines: 15
}; 