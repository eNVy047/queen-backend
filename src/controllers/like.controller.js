import { Like } from "../models/like.model.js";  
import { User } from "../models/user.model.js"; 

// 1. Send a like or superlike
export const sendLike = async (req, res) => {
    const { targetUserId, isSuperlike = false } = req.body;
    const likedBy = req.user._id;

    if (likedBy.toString() === targetUserId) {
        return res.status(400).json({ message: "You can't like yourself." });
    }

    try {
        const like = await Like.findOneAndUpdate(
            { likedBy, targetUser: targetUserId },
            { likedBy, targetUser: targetUserId, isSuperlike },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Check if mutual like exists (match!)
        const isMatch = await Like.findOne({
            likedBy: targetUserId,
            targetUser: likedBy
        });

        res.status(200).json({
            message: isMatch ? "It's a match!" : "Like sent.",
            like,
            match: !!isMatch
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 2. Remove a like
export const removeLike = async (req, res) => {
    const likedBy = req.user._id;
    const { targetUserId } = req.body;

    try {
        const result = await Like.findOneAndDelete({ likedBy, targetUser: targetUserId });
        if (!result) {
            return res.status(404).json({ message: "Like not found." });
        }
        res.status(200).json({ message: "Like removed." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 3. Get all likes sent by the user
export const getLikes = async (req, res) => {
    const likedBy = req.user._id;

    try {
        const likes = await Like.find({ likedBy }).populate("targetUser", "name avatar");
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 4. Get all users who liked the current user
export const getLikedMe = async (req, res) => {
    const targetUser = req.user._id;

    try {
        const likedMe = await Like.find({ targetUser }).populate("likedBy", "name avatar");
        res.status(200).json(likedMe);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 5. Check if a match exists with another user
export const checkMatch = async (req, res) => {
    const userA = req.user._id;
    const { userBId } = req.params;

    try {
        const userALikesB = await Like.findOne({ likedBy: userA, targetUser: userBId });
        const userBLikesA = await Like.findOne({ likedBy: userBId, targetUser: userA });

        res.status(200).json({ isMatch: !!(userALikesB && userBLikesA) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
