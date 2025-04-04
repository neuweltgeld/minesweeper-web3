import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Player from '../../../models/Player';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const player = await Player.findOne({ address });
      if (!player) {
        // Yeni oyuncu oluştur
        const newPlayer = await Player.create({
          address,
          remainingGames: 10,
          lastResetTime: new Date(),
        });
        return res.status(200).json(newPlayer);
      }

      // 24 saat kontrolü
      const now = new Date();
      const lastReset = new Date(player.lastResetTime);
      const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastReset >= 24) {
        player.remainingGames = 10;
        player.lastResetTime = now;
        await player.save();
      }

      return res.status(200).json(player);
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { action } = req.body;

      if (action === 'use') {
        const player = await Player.findOne({ address });
        if (!player || player.remainingGames <= 0) {
          return res.status(400).json({ error: 'No games remaining' });
        }
        player.remainingGames -= 1;
        player.totalGames += 1;
        await player.save();
        return res.status(200).json(player);
      }

      if (action === 'add') {
        const player = await Player.findOne({ address });
        if (!player) {
          return res.status(404).json({ error: 'Player not found' });
        }
        const { amount } = req.body;
        player.remainingGames += amount;
        player.purchasedGames += amount;
        await player.save();
        return res.status(200).json(player);
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 