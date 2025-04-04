import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  remainingGames: {
    type: Number,
    default: 3,
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

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema); 