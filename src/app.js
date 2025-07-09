import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import http from "http";

const app = express()
const server = http.createServer(app);

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

// rouites
app.use('/api/auth', authRoutes);

export { app }