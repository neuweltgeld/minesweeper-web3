import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Veri dizinini oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// JSON dosyalarını oluştur
if (!fs.existsSync(PLAYERS_FILE)) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify({}));
}
if (!fs.existsSync(LEADERBOARD_FILE)) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

// Oyuncu verilerini yönet
export async function getPlayer(address: string) {
  try {
    const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
    return data[address] || null;
  } catch (error) {
    console.error('Oyuncu verisi okuma hatası:', error);
    return null;
  }
}

export async function updatePlayer(address: string, updates: any) {
  try {
    const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
    data[address] = { ...data[address], ...updates };
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2));
    return data[address];
  } catch (error) {
    console.error('Oyuncu verisi güncelleme hatası:', error);
    throw error;
  }
}

export async function createPlayer(address: string, initialData: any) {
  try {
    const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
    data[address] = initialData;
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2));
    return data[address];
  } catch (error) {
    console.error('Oyuncu oluşturma hatası:', error);
    throw error;
  }
}

// Liderlik tablosu verilerini yönet
export async function getLeaderboard() {
  try {
    return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
  } catch (error) {
    console.error('Liderlik tablosu okuma hatası:', error);
    return [];
  }
}

export async function updateLeaderboard(entry: any) {
  try {
    const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
    const index = data.findIndex((item: any) => item.address === entry.address);
    
    if (index !== -1) {
      if (entry.score > data[index].score) {
        data[index] = { ...entry, date: new Date().toISOString() };
      }
    } else {
      data.push({ ...entry, date: new Date().toISOString() });
    }
    
    // Skora göre sırala
    data.sort((a: any, b: any) => b.score - a.score);
    
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Liderlik tablosu güncelleme hatası:', error);
    throw error;
  }
}

export async function resetLeaderboard() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('Liderlik tablosu sıfırlama hatası:', error);
    throw error;
  }
} 