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
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have an owner!']
  },
  to: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Notification must have a receiver!']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  seen: {
    type: Boolean,
    default: false
  }
});

notificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'from',
    select: 'firstName lastName profilePhoto'
  });

  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
