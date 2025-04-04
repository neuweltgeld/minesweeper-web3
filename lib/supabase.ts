import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL ve Key tanımlanmamış!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Oyuncu verilerini getir
export async function getPlayer(address: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('address', address)
    .single();

  if (error) {
    console.error('Oyuncu getirme hatası:', error);
    throw error;
  }

  return data;
}

// Oyuncu verilerini güncelle
export async function updatePlayer(address: string, updates: any) {
  const { data, error } = await supabase
    .from('players')
    .upsert({ address, ...updates })
    .select()
    .single();

  if (error) {
    console.error('Oyuncu güncelleme hatası:', error);
    throw error;
  }

  return data;
}

// Yeni oyuncu oluştur
export async function createPlayer(address: string, initialData: any) {
  const { data, error } = await supabase
    .from('players')
    .insert([{ address, ...initialData }])
    .select()
    .single();

  if (error) {
    console.error('Oyuncu oluşturma hatası:', error);
    throw error;
  }

  return data;
} 