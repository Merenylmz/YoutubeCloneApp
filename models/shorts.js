const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    comment: String,
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"}
});

const likeAndUnlikeSchema = mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"}
});


const shortSchema = mongoose.Schema({
    title: String,
    description: String,
    videoUrl: String,
    channelId: {type: mongoose.Schema.Types.ObjectId, ref: "channels"},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    like: {type: [likeAndUnlikeSchema], default: null},
    unLike: {type: [likeAndUnlikeSchema], default: null},
    comments: {type: [commentSchema], default: []},
    views: {type: Number, default: 0}
});

const Shorts = mongoose.model("shorts", shortSchema);

module.exports = Shorts;