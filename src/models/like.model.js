import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    targetUser: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isSuperlike: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


export const Like = mongoose.model("Like", likeSchema)