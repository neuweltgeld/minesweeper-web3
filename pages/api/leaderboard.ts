import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    const { address, score } = req.body;

    if (!address || typeof score !== 'number') {
      return res.status(400).json({ error: 'Geçersiz veri' });
    }

    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Metod desteklenmiyor' });
} 