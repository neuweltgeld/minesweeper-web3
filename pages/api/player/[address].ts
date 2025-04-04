import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Geçersiz adres' });
  }

  if (req.method === 'GET') {
    // Basit bir yanıt döndür
    return res.status(200).json({
      address,
      remaining_games: 3,
      last_reset_time: new Date().toISOString(),
      total_games: 0,
      purchased_games: 0
    });
  }

  if (req.method === 'PUT') {
    const { action, amount } = req.body;

    if (action === 'use') {
      return res.status(200).json({ success: true });
    }

    if (action === 'add' && typeof amount === 'number') {
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Geçersiz istek' });
  }

  return res.status(405).json({ error: 'Metod desteklenmiyor' });
} 