const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    postType: {
      type: String,
      default: 'Photo'
    },
    user: {
      type: Object,
      required: [true, 'A post must have user referrence!']
    },
    createdAt: {
      type: Date,
      default: Date.now() + 2000
    },
    createdAtModified: String,
    likes: [
      {
        userId: {
          type: String,
          required: [true, 'Like must have user ID!']
        },
        firstName: String,
        lastName: String,
        userPhoto: String
      }
    ],
    likedByMe: {
      type: Boolean,
      default: false
    },
    comments: [
      {
        userId: {
          type: String,
          required: [true, 'Comment must have user ID!']
        },
        firstName: String,
        lastName: String,
        userPhoto: String,
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

  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
