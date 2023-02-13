const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

//Log In
router.get('/auth/login', authController.login_get);
router.post('/auth/login', authController.login_post);
//Log Out
router.get('/auth/logout', authController.logout_get);
//Forgot/Reset password for users who can't log in
router.get('/auth/forgot-password', authController.password_reset_get);
router.post('/auth/forgot-password',authController.password_reset_post);
router.get('/auth/password_reset_sent',authController.password_reset_sent);
router.get('/auth/set-new-password/:token/:newPassword', authController.password_changed);
router.get('/auth/password-changed', authController.password_changed_home);
router.get('/auth/reset-password-report/:token', authController.password_reset_report);
//Request password change for logged in user
router.post('/auth/change-password', authController.changePassword);
//Profile Photo
router.get('/profile-photo', authController.getPhoto);
router.post('/profile-photo', authController.postPhoto);
module.exports = router;