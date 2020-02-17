const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadPost = upload.single('content');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file)
    return next(new AppError('There is no content in this post!', 400));

  req.file.post = `post-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    // .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/posts/${req.file.post}`);

  next();
});

exports.createPost = catchAsync(async (req, res, next) => {
  req.body.content = req.file.post;
  req.body.user = req.user._id;
  const post = await Post.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      post
    }
  });
});

exports.likePost = catchAsync(async (req, res, next) => {
  await Post.findByIdAndUpdate(req.params.postId, {
    $push: {
      likes: {
        userId: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userPhoto: req.user.profilePhoto
      }
    }
  });

  res.status(200).json({
    status: 'success'
  });
});

exports.makeComment = catchAsync(async (req, res, next) => {
  if (!req.body.text) {
    return next(new AppError('You must have some text in your comment!', 400));
  }

  await Post.findByIdAndUpdate(req.params.postId, {
    $push: {
      comments: {
        userId: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userPhoto: req.user.profilePhoto,
        comment: req.body.text
      }
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      comment: req.body.text
    }
  });
});
