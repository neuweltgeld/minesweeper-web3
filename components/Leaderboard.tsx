import { LeaderboardEntry } from '../types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">En İyi Skorlar</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2">Sıra</th>
            <th className="text-left py-2">Cüzdan</th>
            <th className="text-left py-2">Skor</th>
            <th className="text-left py-2">Süre</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.date} className="border-b border-gray-700">
              <td className="py-2">{index + 1}</td>
              <td className="py-2">{`${entry.address.slice(0, 4)}...${entry.address.slice(-4)}`}</td>
              <td className="py-2">{entry.score}</td>
              <td className="py-2">{entry.time}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 