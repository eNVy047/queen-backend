import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import chalk from "chalk";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(chalk.bgGreen`\n🥳🥳 MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(chalk.bgRed`🧐🧐 MONGODB connection FAILED , ${error}`);
        process.exit(1)
    }
}

export default connectDB