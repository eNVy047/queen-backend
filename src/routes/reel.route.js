import { Router } from "express";
import {
  createReel,
  getAllReels,
  getReelById,
  getReelsByUser,
  toggleReelLike,
  addReelComment,
  deleteReelComment,
  incrementViews,
  incrementShares,
  deleteReel,
} from "../controllers/reel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";
const router = Router(); 

router.use(verifyJWT);

 

// CRUD
router.post("/",upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),createReel);
router.get("/",getAllReels);
router.get("/:id",getReelById);
router.get("/user/:userId",getReelsByUser);

// Like / Comment
router.put("/:reelId/like",toggleReelLike);
router.post("/:reelId/comments",addReelComment);
router.delete("/:reelId/comments/:commentId", deleteReelComment);

// Views / Shares
router.put("/:reelId/views", incrementViews);
router.put("/:reelId/shares", incrementShares);

// Delete / Publish
router.delete("/:reelId", deleteReel);
//router.patch("/:reelId/publish",toggleReelPublish);

export default router;
