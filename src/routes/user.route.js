import { Router } from "express";
import {
  addProfile,
  addUserdetails,
  deactivateAccount,
  deleteAccount,
  getCurrentUser,
  getUserStats,
  loginWithEmail,
  logoutUser,
  reactivateAccount,
  refreshAccessToken,
  registerUser,
  resendPhoneOTP,
  changeCurrentPassword,
  sendEmailVerification,
  sendLoginOTP,
  updateUserAvatar,
  updateUserProfile,
  verifyEmail,
  verifyLoginOTP,
  verifyPhoneOTP,
  addCard,
  updateCard,
  getRandomUserCards,
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
 

// 🔐 Authenticated Routes
router.post("/change-password",verifyJWT, changeCurrentPassword);
router.post("/logout", verifyJWT, logoutUser);
router.post("/send-verify-email", verifyJWT, sendEmailVerification);
router.post("/verify-email", verifyJWT, verifyEmail);
router.get("/get-current-user", verifyJWT, getCurrentUser);
router.post("/add-user-details", verifyJWT, addUserdetails);
router.patch("/update-profile", verifyJWT, updateUserProfile); 
router.post("/deactivate", verifyJWT, deactivateAccount);
router.post("/reactivate", verifyJWT, reactivateAccount); 
router.post("/delete-account", verifyJWT, deleteAccount);
router.get("/get-stats", verifyJWT, getUserStats);
router.post("/add-profile", verifyJWT, upload.single("avatar"), addProfile);
router.patch("/update-avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);
router.post("/add-card", verifyJWT, upload.single("cardAvatar"), addCard);
router.patch("/update-card", verifyJWT, upload.single("cardAvatar"), updateCard);
router.get("/get-card", verifyJWT, getRandomUserCards);



export default router;
