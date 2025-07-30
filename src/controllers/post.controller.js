import { Post } from "../models/post.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Create Post
export const createPost = asyncHandler(async (req, res) => {
  const { caption, tags, location } = req.body;
  const owner = req.user._id;

  // Check if files are present
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one media file is required");
  }

  const uploadedMedia = [];

  // Upload all media files to Cloudinary
  for (const file of req.files) {
    const result = await uploadOnCloudinary(file.path);
    if (!result?.url) {
      throw new ApiError(400, "Media upload failed");
    }
    uploadedMedia.push(result.url);
  }

  // Create the post document
  const post = await Post.create({
    media: uploadedMedia,
    caption,
    tags,
    location,
    owner,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

// 2. Get All Posts (Paginated)
export const getAllPosts = async (req, res) => {
  const { page = 1, limit = 10, tag, location } = req.query;

  try {
    const aggregate = Post.aggregate([
      {
        $match: {
          ...(tag ? { tags: tag } : {}),
          ...(location ? { location: { $regex: location, $options: "i" } } : {}),
          isPublished: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const options = { page: Number(page), limit: Number(limit), populate: "owner" };
    const posts = await Post.aggregatePaginate(aggregate, options);

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};

// 3. Get Post by ID
export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id).populate("owner likes comments.user");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error });
  }
};

// 4. Get Posts by a User
export const getPostsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user posts", error });
  }
};

// 5. Like / Unlike a Post
export const toggleLike = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const index = post.likes.indexOf(userId);
    if (index > -1) {
      post.likes.splice(index, 1); // Unlike
    } else {
      post.likes.push(userId); // Like
    }
    await post.save();
    res.status(200).json({ message: "Toggled like", likes: post.likes });
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error });
  }
};

// 6. Add Comment
export const addComment = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const user = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user, text });
    await post.save();

    res.status(201).json({ message: "Comment added", comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};

// 7. Delete Comment
export const deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.remove();
    await post.save();

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};

// 8. Update Post (caption, tags, location)
export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const { caption, tags, location } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    if (caption !== undefined) post.caption = caption;
    if (tags !== undefined) post.tags = tags;
    if (location !== undefined) post.location = location;

    await post.save();
    res.status(200).json({ message: "Post updated", post });
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
};

// 9. Delete Post
export const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.remove();
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
};

// 10. Toggle Publish Status
// export const togglePublish = async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user._id;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     if (post.owner.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "Not authorized to change publish status" });
//     }

//     post.isPublished = !post.isPublished;
//     await post.save();

//     res.status(200).json({ message: "Publish status updated", isPublished: post.isPublished });
//   } catch (error) {
//     res.status(500).json({ message: "Error toggling publish", error });
//   }
// };
