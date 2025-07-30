import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    sendLike,
    removeLike,
    getLikes,
    getLikedMe,
    checkMatch
} from "../controllers/like.controller.js";

const router = Router(); 

router.use(verifyJWT);



router.post("/like", sendLike);
router.delete("/like",removeLike);
router.get("/likes",getLikes);
router.get("/liked-me", getLikedMe);
router.get("/match/:userBId", checkMatch);

export default router;
