import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Leaderboard from '../../models/Leaderboard';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const leaderboard = await Leaderboard.find()
        .sort({ score: -1, time: 1 })
        .limit(20);
      return res.status(200).json(leaderboard);
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { address, score } = req.body;
      
      const existingEntry = await Leaderboard.findOne({ address });
      
      if (existingEntry) {
        if (score > existingEntry.score) {
          existingEntry.score = score;
          existingEntry.date = new Date();
          await existingEntry.save();
          return res.status(200).json({ isNewHighScore: true });
        }
        return res.status(200).json({ isNewHighScore: false });
      }

      await Leaderboard.create({
        address,
        score,
        date: new Date()
      });
      return res.status(201).json({ message: 'Score saved', isNewHighScore: true });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 