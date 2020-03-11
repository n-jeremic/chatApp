const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/news');
});

router.get('/login', viewController.login);
router.get('/signup', viewController.signup);
router.get('/resetPassword/:token', viewController.resetPassword);

router.use(authController.protect);

router.get('/chat', viewController.chat);
router.get('/me', viewController.myProfile);
router.get('/profile/:user_id', viewController.getUser);
router.get('/news', viewController.getNews);
router.get('/game', viewController.pigGame);
router.get('/playGame/:gameId', viewController.playGame);
router.get('/inbox', viewController.getMyInbox);

module.exports = router;
