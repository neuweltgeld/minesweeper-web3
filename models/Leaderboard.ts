import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  score: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema); 