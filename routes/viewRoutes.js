const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/news');
});

router.get('/login', viewController.login);
router.get('/signup', viewController.signup);
router.get('/chat', authController.protect, viewController.chat);
router.get('/me', authController.protect, viewController.myProfile);
router.get('/profile/:user_id', authController.protect, viewController.getUser);
router.get('/news', authController.protect, viewController.getNews);
router.get('/game', authController.protect, viewController.pigGame);

module.exports = router;
