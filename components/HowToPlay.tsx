import { useState } from 'react';
import { POWER_UP_COSTS } from '../types/game';

export function HowToPlay() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg shadow-lg transition-all duration-300 font-pixel"
      >
        ℹ️
      </button>
      {showInfo && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 p-4 rounded-lg shadow-lg border border-purple-500 font-pixel">
          <h3 className="text-lg font-bold mb-2 text-purple-400">How to Play</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Left click to reveal cells</li>
            <li>Right click to flag mines</li>
            <li>Numbers show adjacent mine count</li>
            <li>Flag all mines and reveal other cells</li>
            <li>Clicking a mine ends the game</li>
            <li>Score is based on time and revealed cells</li>
            <li>Top scores appear on the leaderboard</li>
          </ol>
        </div>
      )}
    </div>
  );
} 