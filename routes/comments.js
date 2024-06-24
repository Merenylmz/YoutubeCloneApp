const express = require("express");
const Videos = require("../models/videos");
const csrf = require("../middleware/csrf");
const router = express.Router();

router.get("/:videoId", async(req, res)=>{
    try {
        const video = await Videos.findOne({_id: req.params.videoId});

        res.send({comments: video.comments});
    } catch (error) {
        console.log(error);
    }
});

router.post("/:id", csrf, async(req, res)=>{
    try {
        const video = await Videos.findOne({_id: req.params.id});
        video.comments.push({
            userId: req.body.userid,
            comment: req.body.comments
        });
        await video.save();

        res.send({videoComments: video.comments});
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;