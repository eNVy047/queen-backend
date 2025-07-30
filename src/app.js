import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import http from "http";
import { Server } from "socket.io";
import { initializeSocketIO } from "./socket/index.js";

const app = express()
const server = http.createServer(app);



const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", io); 

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*" 
        : process.env.CORS_ORIGIN?.split(","), 
    credentials: true,
  })
);

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//import 
import authRoutes from "./routes/user.route.js"
import chatRouter from "./routes/chat.route.js";
import messageRouter from "./routes/message.route.js"
import likeRouter from "./routes/like.route.js"
import postRouter from "./routes/post.route.js"
import reelRouter from "./routes/reel.route.js"
import notificationRouter from "./routes/notification.route.js"

// rouites
app.use('/api/auth', authRoutes);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/likes", likeRouter);
app.use("/api/posts", postRouter);
app.use("/api/reels", reelRouter);
app.use("/api/notification", notificationRouter);



initializeSocketIO(io);

export { app }