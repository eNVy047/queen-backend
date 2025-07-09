import { User } from "../models/user.model.js";

import jwtUtils from "../utils/jwtUtils.js";
import emailService from "../utils/emailService.js";
import smsService from "../utils/smsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";

// Helper function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// User Registration
const registerUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email || !phone || !password) {
    throw new ApiError(400, "All fields are required");
  }
  

  const existedUser = await User.findOne({
    $or: [{ phone }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or phone already exists");
  }

  // Generate phone verification OTP
  const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    email,
    phone,
    password,
    phoneOTP,
    phoneOTPExpiry,
  });

  // Send OTP via SMS
  await smsService.sendOTP(phone, phoneOTP);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -phoneOTP -phoneOTPExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to register user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully. OTP sent to phone."));
});

// Phone OTP Verification
const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  const user = await User.findOne({ phone });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.phoneOTP !== otp || new Date() > user.phoneOTPExpiry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Mark phone as verified and clear OTP
  user.isPhoneVerified = true;
  user.phoneOTP = undefined;
  user.phoneOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Phone verified successfully"));
});

// Resend Phone OTP
const resendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isPhoneVerified) {
    throw new ApiError(400, "Phone is already verified");
  }

  const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.phoneOTP = phoneOTP;
  user.phoneOTPExpiry = phoneOTPExpiry;
  await user.save({ validateBeforeSave: false });

  await smsService.sendOTP(phone, phoneOTP);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP resent successfully"));
});

// Phone Login - Send OTP
const sendLoginOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated");
  }

  const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.phoneOTP = phoneOTP;
  user.phoneOTPExpiry = phoneOTPExpiry;
  await user.save({ validateBeforeSave: false });

  await smsService.sendOTP(phone, phoneOTP);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Login OTP sent successfully"));
});

// Phone Login - Verify OTP
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.phoneOTP !== otp || new Date() > user.phoneOTPExpiry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Clear OTP after verification
  user.phoneOTP = undefined;
  user.phoneOTPExpiry = undefined;
  user.lastActive = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -phoneOTP -phoneOTPExpiry"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

// Email Login
const loginWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.lastActive = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
      lastActive: new Date(),
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwtUtils.verifyRefreshToken(incomingRefreshToken);

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordResetEmail(email, resetUrl);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset email sent"));
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Add Profile details
const addProfile = asyncHandler(async (req, res) =>{
    const { username, firstName, lastName, dateOfBirth } = req.body;
     
    if(!username || !firstName || !lastName || !dateOfBirth){
        throw new ApiError(400, "All field are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }],
    });
    
    if (existedUser) {
        throw new ApiError(409, "User alredy exist");
    }

    if (!req.file || !req.file.path) {
        throw new ApiError(400, "Avatar file is required");
    }
    
    // ✅ Upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(req.file.path);
    
    if (!avatar?.url) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.findById(req.user._id);
      
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found'
        });
    }
      
    // Update fields if provided
    if(username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if(dateOfBirth) user.dateOfBirth = dateOfBirth;
      
    await user.save();

    return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully"));
})

const addUserdetails = asyncHandler(async(req, res) =>{
    const { gender, lookingFor, goal, culture, interests, nationality, religion, bio} = req.body;
    
    if(!gender || !lookingFor || !goal || !culture || !interests || !nationality || !religion || !bio){
        throw new ApiError(400, "All field are required");
    }

    const user = await User.findById(req.user._id);
      
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found'
        });
    }
      
    // Update fields if provided
    if(gender) user.gender = gender;
    if (lookingFor) user.lookingFor = lookingFor;
    if (goal) user.goal = goal;
    if(culture) user.culture = culture;
    if(interests) user.interests = interests;
    if (nationality) user.nationality = nationality;
    if (religion) user.religion = religion;
    if(bio) user.bio = bio;
      
    await user.save();
    
    return res
    .status(200)
    .json(new ApiResponse(200, "User details updated successfully"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Check if user has uploaded an avatar
  if (!req.file?.filename) {
    throw new ApiError(400, "Avatar image is required");
  }

  // get avatar file system url and local path
  const avatarUrl = getStaticFilePath(req, req.file?.filename);
  const avatarLocalPath = getLocalPath(req.file?.filename);

  const user = await User.findById(req.user._id);

  let updatedUser = await User.findByIdAndUpdate(
    req.user._id,

    {
      $set: {
        // set the newly uploaded avatar
        avatar: {
          url: avatarUrl,
          localPath: avatarLocalPath,
        },
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  // remove the old avatar
  removeLocalFile(user.avatar.localPath);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    lookingFor,
    goal,
    culture,
    interests,
    nationality,
    religion,
    bio
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  // ✅ Check for username conflict if it's being updated
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ApiError(409, "Username already exists");
    }
    user.username = username;
  }

  // ✅ Optional avatar upload
  if (req.file?.path) {
    const avatar = await uploadOnCloudinary(req.file.path);
    if (!avatar?.url) {
      throw new ApiError(400, "Avatar upload failed");
    }
    user.avatar = avatar.url;
  }

  // ✅ Update only provided fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (gender) user.gender = gender;
  if (lookingFor) user.lookingFor = lookingFor;
  if (goal) user.goal = goal;
  if (culture) user.culture = culture;
  if (interests) user.interests = interests;
  if (nationality) user.nationality = nationality;
  if (religion) user.religion = religion;
  if (bio) user.bio = bio;

  await user.save();

  return res.status(200).json(new ApiResponse(200, "User profile updated successfully"));
});

const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = false;
  await user.save();

  res.json(new ApiResponse(200, 'Account deactivated successfully'));
});

const reactivateAccount = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.isActive = true;
  await user.save();

  res.json(new ApiResponse(200, 'Account reactivated successfully'));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await User.findByIdAndDelete(req.user._id);

  res.json(new ApiResponse(200, 'Account deleted successfully'));
});

const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const stats = {
    profileCompletion: calculateProfileCompletion(user),
    accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
    lastActive: user.lastActive,
    isPremium: user.isPremium,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  };

  res.json(new ApiResponse(200, 'User statistics fetched successfully', { stats }));
});

function calculateProfileCompletion(user) {
  let completion = 0;
  const totalFields = 8;

  if (user.firstName) completion++;
  if (user.lastName) completion++;
  if (user.bio?.trim()) completion++;
  if (user.photos?.length > 0) completion++;
  if (user.location?.city) completion++;
  if (user.isEmailVerified) completion++;
  if (user.isPhoneVerified) completion++;
  if (user.interestedIn?.length > 0) completion++;

  return Math.round((completion / totalFields) * 100);
}

export {
  registerUser,
  verifyPhoneOTP,
  resendPhoneOTP,
  sendLoginOTP,
  verifyLoginOTP,
  loginWithEmail,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  addProfile,
  addUserdetails,
  updateUserAvatar,
  updateUserProfile,
  getUserStats,
  deleteAccount,
  reactivateAccount,
  deactivateAccount,
};