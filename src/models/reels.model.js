import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
 
const reelSchema = new Schema(
  {
    videoFile: {
      type: String, 
      required: true,
    },
    thumbnail: {
      type: String, 
    },
    caption: {
      type: String,
      default: "",
    },
    duration: {
      type: Number, 
      required: true,
    },
    audioTrack: {
      type: String, 
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String], 
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reelSchema.plugin(mongooseAggregatePaginate);

export const Reel = mongoose.model("Reel", reelSchema);
