const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const Game = require('../models/gameModel');
const Notification = require('../models/notificationModel');
const Chat = require('../models/chatModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (object, ...wantedFields) => {
  const filteredObj = {};
  Object.keys(object).forEach(key => {
    if (wantedFields.includes(key)) {
      filteredObj[key] = object[key];
    }
  });

  return filteredObj;
};

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

exports.uploadUserPhoto = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]);

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  if (req.files.profilePhoto) {
    req.files.profilePhoto[0].filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.files.profilePhoto[0].buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.files.profilePhoto[0].filename}`);
  } else if (req.files.coverPhoto) {
    req.files.coverPhoto[0].filename = `userCover-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.files.coverPhoto[0].buffer)
      .resize(1000, 800)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.files.coverPhoto[0].filename}`);
  }

  next();
});

exports.myNewMessages = catchAsync(async (req, res, next) => {
  const me = await User.findById(req.user.id).populate('newMessages');

  if (me.newMessages.length == 0) {
    return res.status(200).json({
      status: 'empty'
    });
  }

  await User.findByIdAndUpdate(req.user.id, {
    $pullAll: { newMessages: me.newMessages }
  });

  res.status(200).json({
    status: 'success',
    data: {
      newMessages: me.newMessages
    }
  });
});

exports.myChatWith = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOne({
    users: { $all: [req.user.id, req.params.user_id] }
  }).select('-__v');

  res.status(200).json({
    status: 'success',
    data: {
      chat
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Please use /updateMyPassword route for changing your password!', 400));
  }
  const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email', 'dateOfBirth');

  if (req.files) {
    if (req.files.profilePhoto) filteredBody.profilePhoto = req.files.profilePhoto[0].filename;
    if (req.files.coverPhoto) filteredBody.coverPhoto = req.files.coverPhoto[0].filename;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser
    }
  });
});

exports.getOnlineUsers = catchAsync(async (req, res, next) => {
  const allUsers = await User.find();

  const sortedUsers = [];
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].id == req.user.id) {
      continue;
    }
    if (allUsers[i].isLoggedIn) {
      sortedUsers.unshift(allUsers[i]);
    } else {
      sortedUsers.push(allUsers[i]);
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      sortedUsers
    }
  });
});

exports.getMyNotificatons = catchAsync(async (req, res, next) => {
  const myNotifications = await Notification.find({ to: req.user.id }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    data: {
      notifications: myNotifications
    }
  });
});

exports.myNewNotifications = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'newNotifications',
    select: '-__v',
    options: { sort: 'createdAt' }
  });

  if (user.newNotifications.length === 0) {
    res.status(200).json({
      status: 'empty'
    });

    return;
  }

  await User.findByIdAndUpdate(req.user.id, { $pullAll: { newNotifications: user.newNotifications } });

  res.status(200).json({
    status: 'success',
    data: {
      notifications: user.newNotifications
    }
  });
});

exports.markNotifAsSeen = catchAsync(async (req, res, next) => {
  const not = await Notification.findByIdAndUpdate(req.params.notif_id, { seen: true }, { new: true });

  if (!not) {
    return next(new AppError('Notification with this ID no longer exists!', 404));
  }

  res.status(200).json({
    status: 'success'
  });
});

exports.searchAllUsers = catchAsync(async (req, res, next) => {
  if (!req.query.query) {
    return next(new AppError('There is no query to search for!', 400));
  }

  let regex = new RegExp(req.query.query, 'i');
  const allUsers = await User.find();
  const results = [];
  allUsers.forEach(user => {
    if (regex.test(user.firstName) || regex.test(user.lastName)) {
      results.push(user);
    }
  });

  res.status(200).json({
    status: 'success',
    results: results.length,
    data: {
      results
    }
  });
});

exports.checkMyGameRequest = catchAsync(async (req, res, next) => {
  const userMe = await User.findById(req.user.id);

  if (!userMe.gameRequest.gameId) {
    return res.status(200).json({
      status: 'empty'
    });
  } else {
    return res.status(200).json({
      status: 'success',
      data: {
        request: userMe.gameRequest
      }
    });
  }
});

exports.getMyMessages = catchAsync(async (req, res, next) => {
  const userMe = await User.findById(req.user._id).populate({
    path: 'chats',
    select: '-__v'
  });

  res.status(200).json({
    status: 'success',
    data: {
      chats: userMe.chats
    }
  });
});
