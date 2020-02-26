const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [
    {
      id: String,
      firstName: String,
      lastName: String,
      profilePhoto: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  homePlayer: {
    _id: String,
    firstName: String,
    lastName: String,
    profilePhoto: String,
    currentScore: {
      type: Number,
      default: 0,
      max: 6
    },
    roundScore: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  awayPlayer: {
    _id: String,
    firstName: String,
    lastName: String,
    profilePhoto: String,
    currentScore: {
      type: Number,
      default: 0,
      max: 6
    },
    roundScore: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  winner: {
    _id: String,
    firstName: String,
    lastName: String,
    profilePhoto: String
  }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
