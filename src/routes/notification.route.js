import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router(); 

router.use(verifyJWT);

router.get("/",getNotifications);
router.patch("/:id/read",markAsRead);
router.delete("/:id",deleteNotification);

export default router;
