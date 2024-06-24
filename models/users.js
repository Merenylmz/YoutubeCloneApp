const mongoose = require("mongoose");

const channelSchema = mongoose.Schema({
    channelId: {type: mongoose.Schema.Types.ObjectId, ref: "channels"}
});

const userSchema = mongoose.Schema({
    userName: String,
    email: String,
    password: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiration: {
        type: Date,
        default: null
    },
    channels: [channelSchema]
});

const Users = mongoose.model("Users", userSchema);

module.exports = Users;