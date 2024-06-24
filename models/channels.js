const mongoose = require("mongoose");

const videosSchema = mongoose.Schema({
    videoId: {type: mongoose.Schema.Types.ObjectId, ref: "videos"}
});

const subscribeSchema = mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"}
});

const channelSchema = mongoose.Schema({
    title: String,
    logoPath: {
        type: String,
        default: null
    },
    description: String,
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    videos: {type: [videosSchema], default: null},
    subscribes: {type: [subscribeSchema], default: null}
});

const Channels = mongoose.model("channels", channelSchema);

module.exports = Channels;