const mongoose = require("mongoose");
const commentSchema = mongoose.Schema({
    comment: String,
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"}
});

const likeAndUnlikeSchema = mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"}
});

const videoSchema = mongoose.Schema({
    title: String,
    description: String,
    comments: [commentSchema],
    views: {
        type: Number,
        default: 0
    },
    likeCount: {type: [likeAndUnlikeSchema], default: null},
    unLikeCount: {type: [likeAndUnlikeSchema], default: null},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    videoPath: String,
    videoContentImageUrl: String,
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "categories"},
    channelId: {type: mongoose.Schema.Types.ObjectId, ref: "channels"}
});

const Videos = mongoose.model("Videos", videoSchema);

module.exports = Videos;