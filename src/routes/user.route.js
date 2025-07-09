import { Router } from "express";
import {
  addProfile,
  addUserdetails,
  deactivateAccount,
  deleteAccount,
  forgotPassword,
  getCurrentUser,
  getUserStats,
  loginWithEmail,
  logoutUser,
  reactivateAccount,
  refreshAccessToken,
  registerUser,
  resendPhoneOTP,
  resetPassword,
  sendLoginOTP,
  updateUserAvatar,
  updateUserProfile,
  verifyLoginOTP,
  verifyPhoneOTP,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// 🔓 Public Routes
router.post("/register", registerUser);
router.post("/login-email", loginWithEmail);
router.post("/login-phone", sendLoginOTP);
router.post("/refresh-token", refreshAccessToken);
router.post("/verify-phone-otp", verifyPhoneOTP);
router.post("/resend-phone-otp", resendPhoneOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


// 🔐 Authenticated Routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/get-current-user", verifyJWT, getCurrentUser);
router.post("/add-user-details", verifyJWT, addUserdetails);
router.post("/update-profile", verifyJWT, updateUserProfile); 
router.post("/deactivate", verifyJWT, deactivateAccount);
router.post("/reactivate", verifyJWT, reactivateAccount); 
router.post("/delete-account", verifyJWT, deleteAccount);
router.post("/get-stats", verifyJWT, getUserStats);
router.post("/add-profile", verifyJWT, upload.single("avatar"), addProfile);
router.post("/update-avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);


export default router;
