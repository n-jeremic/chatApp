const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    postType: {
      type: String,
      default: 'Photo'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A post must have user referrence!']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    createdAtModified: String,
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Like must have a user data!']
      }
    ],
    likedByMe: {
      type: Boolean,
      default: false
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: [true, 'Comment must have a user data!']
        },
        comment: {
          type: String,
          required: [true, 'Comment must have some content!']
        }
      }
    ],
    content: {
      type: String,
      required: [true, 'A post must have some content!']
    },
    description: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

postSchema.pre(/^find/, function(next) {
  this.sort('-createdAt');
  this.populate({
    path: 'likes',
    select: 'firstName lastName profilePhoto'
  })
    .populate({
      path: 'comments.user',
      select: 'firstName lastName profilePhoto'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName profilePhoto'
    });

  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
