import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  toggleLike,
  addComment,
  deleteComment,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router(); 

router.use(verifyJWT);

// CRUD routes
router.post("/",upload.array("media", 5), createPost);
router.get("/", getAllPosts);
router.get("/:id",getPostById);
router.get("/user/:userId",getPostsByUser);

// Likes
router.put("/:postId/like",toggleLike);

// Comments
router.post("/:postId/comments",addComment);
router.delete("/:postId/comments/:commentId",deleteComment);

// Update/Delete
router.put("/:postId", updatePost);
router.delete("/:postId",deletePost);

// // Publish toggle
// router.patch("/:postId/publish",togglePublish);

export default router;
