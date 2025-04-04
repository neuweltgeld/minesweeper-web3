import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .delete()
        .neq('id', 0);
      
      if (error) throw error;
      return res.status(200).json({ message: 'Leaderboard reset successfully' });
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return res.status(200).json(data);
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

      const { data: existingEntry, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('address', address)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      if (existingEntry) {
        if (score > existingEntry.score) {
          const { error: updateError } = await supabase
            .from('leaderboard')
            .update({ score, date: new Date().toISOString() })
            .eq('address', address);

          if (updateError) throw updateError;
          console.log('Updated existing entry');
          return res.status(200).json({ isNewHighScore: true });
        }
        console.log('Score not higher than existing');
        return res.status(200).json({ isNewHighScore: false });
      }

      const { error: insertError } = await supabase
        .from('leaderboard')
        .insert([{ address, score, date: new Date().toISOString() }]);

      if (insertError) throw insertError;
      console.log('Created new entry');
      return res.status(201).json({ message: 'Score saved', isNewHighScore: true });
    } catch (error) {
      console.error('Error saving score:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 