const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.get('/logOut', authController.logOut);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizePhoto, userController.updateMe);
router.patch('/updateMyPassword', authController.updateMyPassword);

router.get('/myChatWith/:user_id', userController.myChatWith);
router.get('/myMessages', userController.getMyMessages);

router.get('/myNotifications', userController.getMyNotificatons);
router.get('/newNotifications', userController.myNewNotifications);
router.patch('/seenNotification/:notif_id', userController.markNotifAsSeen);

router.get('/myGameRequest', userController.checkMyGameRequest);

router.get('/searchUsers', userController.searchAllUsers);

router.get('/newMessages', userController.myNewMessages);

router.get('/onlineUsers', userController.getOnlineUsers);

router.get('/usersLocations', userController.getUsersLocations);

module.exports = router;
