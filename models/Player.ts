import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  remainingGames: {
    type: Number,
    default: 10,
  },
  lastResetTime: {
    type: Date,
    default: Date.now,
  },
  totalGames: {
    type: Number,
    default: 0,
  },
  purchasedGames: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema); 