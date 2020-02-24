const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logOut', authController.protect, authController.logOut);
router.patch('/updateMe', authController.protect, userController.uploadUserPhoto, userController.resizePhoto, userController.updateMe);
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);

router.get('/myChats', authController.protect, userController.getAllChats);
router.get('/myChatWith/:user_id', authController.protect, userController.myChatWith);

router.get('/myNotifications', authController.protect, userController.getMyNotificatons);
router.get('/NewNotifications', authController.protect, userController.myNewNotifications);
router.patch('/seenNotification/:notif_id', authController.protect, userController.markNotifAsSeen);

router.get('/NewMessages', authController.protect, userController.myNewMessages);

router.get('/onlineUsers', authController.protect, userController.getOnlineUsers);

module.exports = router;
