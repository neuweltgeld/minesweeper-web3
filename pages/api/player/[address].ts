import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Player from '../../../models/Player';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Geçersiz adres' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      let player = await Player.findOne({ address });
      
      if (!player) {
        player = await Player.create({
          address,
          remainingGames: 3,
          lastResetTime: new Date(),
          totalGames: 0,
          purchasedGames: 0
        });
      } else {
        // 24 saat kontrolü
        const lastReset = new Date(player.lastResetTime);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceReset >= 24) {
          player = await Player.findOneAndUpdate(
            { address },
            {
              remainingGames: 3,
              lastResetTime: now
            },
            { new: true }
          );
        }
      }
      
      return res.status(200).json(player);
    } catch (error) {
      console.error('Oyuncu verisi alma hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { action, amount } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: 'Eylem belirtilmedi' });
      }

      let player = await Player.findOne({ address });
      if (!player) {
        return res.status(404).json({ error: 'Oyuncu bulunamadı' });
      }

      if (action === 'use') {
        if (player.remainingGames <= 0) {
          return res.status(400).json({ error: 'Kalan oyun hakkınız yok' });
        }
        
        player = await Player.findOneAndUpdate(
          { address },
          {
            $inc: {
              remainingGames: -1,
              totalGames: 1
            }
          },
          { new: true }
        );
      } else if (action === 'add') {
        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return res.status(400).json({ error: 'Geçersiz miktar' });
        }
        
        player = await Player.findOneAndUpdate(
          { address },
          {
            $inc: {
              remainingGames: amount,
              purchasedGames: amount
            }
          },
          { new: true }
        );
      } else {
        return res.status(400).json({ error: 'Geçersiz eylem' });
      }

      return res.status(200).json(player);
    } catch (error) {
      console.error('Oyuncu güncelleme hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Metod desteklenmiyor' });
} 