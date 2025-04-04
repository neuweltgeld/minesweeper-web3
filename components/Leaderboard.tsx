import { LeaderboardEntry } from '../types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-purple-500">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel">
        Leaderboard
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 font-pixel">
              <th className="py-2">Rank</th>
              <th className="py-2">Address</th>
              <th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.address} className="text-sm hover:bg-gray-700 font-pixel">
                <td className="py-2">{index + 1}</td>
                <td className="py-2 text-purple-400">{`${entry.address.slice(0, 4)}...${entry.address.slice(-4)}`}</td>
                <td className="py-2">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 