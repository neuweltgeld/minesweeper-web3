import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Leaderboard from '../../models/Leaderboard';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'DELETE') {
    try {
      await Leaderboard.deleteMany({});
      return res.status(200).json({ message: 'Leaderboard reset successfully' });
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const leaderboard = await Leaderboard.find()
        .sort({ score: -1, date: -1 })
        .limit(20);
      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('Received score save request:', req.body);
      
      const { address, score } = req.body;
      
      if (!address || score === undefined) {
        console.error('Missing required fields:', { address, score });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingEntry = await Leaderboard.findOne({ address });
      console.log('Existing entry:', existingEntry);
      
      if (existingEntry) {
        if (score > existingEntry.score) {
          existingEntry.score = score;
          existingEntry.date = new Date();
          await existingEntry.save();
          console.log('Updated existing entry');
          return res.status(200).json({ isNewHighScore: true });
        }
        console.log('Score not higher than existing');
        return res.status(200).json({ isNewHighScore: false });
      }

      const newEntry = await Leaderboard.create({
        address,
        score,
        date: new Date()
      });
      console.log('Created new entry:', newEntry);
      return res.status(201).json({ message: 'Score saved', isNewHighScore: true });
    } catch (error) {
      console.error('Error saving score:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 