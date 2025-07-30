import { Reel } from "../models/reels.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Create Reel
export const createReel = async (req, res) => {
  try {
    const { caption, duration, audioTrack, tags } = req.body;
    const owner = req.user._id; // Set by auth middleware

    // ✅ Validate required video file
    if (!req.files || !req.files.video || req.files.video.length === 0) {
      throw new ApiError(400, "Video file is required");
    }

    // ✅ Upload video to Cloudinary
    const videoUpload = await uploadOnCloudinary(req.files.video[0].path, "video");
    if (!videoUpload?.url) {
      throw new ApiError(500, "Video upload failed");
    }

    // ✅ Optional thumbnail upload
    let thumbnailUrl = null;
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
      if (!thumbnailUpload?.url) {
        throw new ApiError(500, "Thumbnail upload failed");
      }
      thumbnailUrl = thumbnailUpload.url;
    }

    // ✅ Create reel in database
    const reel = await Reel.create({
      videoFile: videoUpload.url,
      thumbnail: thumbnailUrl,
      caption,
      duration,
      audioTrack,
      tags,
      owner,
    });

    return res.status(201).json(
      new ApiResponse(201, { reel }, "Reel created successfully")
    );
  } catch (error) {
    console.error("Error creating reel:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create reel",
    });
  }
};


// 2. Get All Reels (Paginated)
export const getAllReels = async (req, res) => {
  const { page = 1, limit = 10, tag } = req.query;

  try {
    const aggregate = Reel.aggregate([
      {
        $match: {
          ...(tag ? { tags: tag } : {}),
          isPublished: true,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const options = {
      page: Number(page),
      limit: Number(limit),
      populate: "owner",
    };

    const reels = await Reel.aggregatePaginate(aggregate, options);
    res.status(200).json(
      new ApiResponse(200, {reels},"Reels fetched succesfully.")
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching reels", error });
  }
};

// 3. Get Reel by ID
export const getReelById = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id).populate("owner likes comments.user");
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    res.status(200).json(reel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reel", error });
  }
};

// 4. Get Reels by User
export const getReelsByUser = async (req, res) => {
  try {
    const reels = await Reel.find({ owner: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(reels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's reels", error });
  }
};

// 5. Like / Unlike Reel
export const toggleReelLike = async (req, res) => {
  const userId = req.user._id;

  try {
    const reel = await Reel.findById(req.params.reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const index = reel.likes.indexOf(userId);
    if (index > -1) {
      reel.likes.splice(index, 1); // Unlike
    } else {
      reel.likes.push(userId); // Like
    }

    await reel.save();
    res.status(200).json({ message: "Toggled like", likes: reel.likes });
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error });
  }
};

// 6. Add Comment
export const addReelComment = async (req, res) => {
  const { text } = req.body;
  const user = req.user._id;

  try {
    const reel = await Reel.findById(req.params.reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    reel.comments.push({ user, text });
    await reel.save();

    res.status(201).json({ message: "Comment added", comments: reel.comments });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};

// 7. Delete Comment
export const deleteReelComment = async (req, res) => {
  const userId = req.user._id;

  try {
    const reel = await Reel.findById(req.params.reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const comment = reel.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.remove();
    await reel.save();
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};

// 8. Increase Views
export const incrementViews = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndUpdate(req.params.reelId, { $inc: { views: 1 } }, { new: true });
    if (!reel) return res.status(404).json({ message: "Reel not found" });
    res.status(200).json({ views: reel.views });
  } catch (error) {
    res.status(500).json({ message: "Error incrementing views", error });
  }
};

// 9. Share Reel (increment share count)
export const incrementShares = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndUpdate(req.params.reelId, { $inc: { shares: 1 } }, { new: true });
    if (!reel) return res.status(404).json({ message: "Reel not found" });
    res.status(200).json({ shares: reel.shares });
  } catch (error) {
    res.status(500).json({ message: "Error incrementing shares", error });
  }
};

// 10. Delete Reel
export const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    if (reel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await reel.remove();
    res.status(200).json({ message: "Reel deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting reel", error });
  }
};

// 11. Toggle Publish Status
// export const toggleReelPublish = async (req, res) => {
//   try {
//     const reel = await Reel.findById(req.params.reelId);
//     if (!reel) return res.status(404).json({ message: "Reel not found" });

//     if (reel.owner.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     reel.isPublished = !reel.isPublished;
//     await reel.save();
//     res.status(200).json({ message: "Publish status updated", isPublished: reel.isPublished });
//   } catch (error) {
//     res.status(500).json({ message: "Error toggling publish", error });
//   }
// };
