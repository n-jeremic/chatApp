const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'There must be a type of notification!'],
    enum: {
      values: ['like', 'comment'],
      message: 'Type can be either like or comment.'
    }
  },
  post: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Notification must have a post attached!']
  },
  from: {
    userId: String,
    firstName: String,
    lastName: String,
    userPhoto: String
  },
  to: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Notification must have a receiver!']
  },
  createdAt: {
    type: Date,
    default: Date.now() + 5000
  },
  seen: {
    type: Boolean,
    default: false
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
