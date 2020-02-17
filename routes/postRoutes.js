const express = require('express');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');

const router = express.Router();

router.post(
  '/addPost',
  authController.protect,
  postController.uploadPost,
  postController.resizePhoto,
  postController.createPost
);

router.post('/like/:postId', authController.protect, postController.likePost);
router.post(
  '/comment/:postId',
  authController.protect,
  postController.makeComment
);

module.exports = router;
