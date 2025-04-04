import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Leaderboard from '../../models/Leaderboard';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const leaderboard = await Leaderboard.find()
        .sort({ score: -1, date: -1 })
        .limit(20);
      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Liderlik tablosu alma hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { address, score } = req.body;
      
      if (!address || typeof score !== 'number') {
        return res.status(400).json({ error: 'Geçersiz veri' });
      }

      const existingEntry = await Leaderboard.findOne({ address });
      
      if (existingEntry) {
        if (score > existingEntry.score) {
          await Leaderboard.findOneAndUpdate(
            { address },
            { score, date: new Date() }
          );
        }
      } else {
        await Leaderboard.create({ address, score });
      }

      const leaderboard = await Leaderboard.find()
        .sort({ score: -1, date: -1 })
        .limit(20);
      
      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Skor kaydetme hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await Leaderboard.deleteMany({});
      return res.status(200).json({ message: 'Liderlik tablosu sıfırlandı' });
    } catch (error) {
      console.error('Liderlik tablosu sıfırlama hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Metod desteklenmiyor' });
} 