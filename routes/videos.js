const express = require("express");
const Videos = require("../models/videos");
const Category = require("../models/categories");
const router = express.Router();
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
      const filename = `file_${Date.now()}-${file.originalname}`;
      cb(null, filename); 
    }
});
const upload = multer({ storage: storage });
const csrf = require("../middleware/csrf");
const isAuth = require("../middleware/isAuth");
const Channels = require("../models/channels");

router.get("/", [isAuth], async(req, res)=>{
    try {
        let videos;
        if (res.locals.user.isAdmin) {
            videos = await Videos.find();
        }
        else{
            videos = await Videos.find({userId: res.locals.user._id});
        }
        res.render("videoList", {videos});
    } catch (error) {
        console.log(error);
    }
});

router.get("/cat/:id", async(req, res)=>{
    const videos = await Videos.find({categoryId: req.params.id});
    const category = await Category.findOne({_id: req.params.id});

    res.render("videoByCategory", {videos, category});
});

router.get("/add", [isAuth], csrf, async(req, res)=>{
    try {
        const categories = await Category.find();
        const channels = await Channels.find({userId: res.locals.user._id});
        res.render("addVideo", {categories, channels});
    } catch (error) {
        console.log(error);
    }
});

router.post("/add", [isAuth], upload.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async(req, res)=>{
    try {

        const file = req.files['file'][0]; 
        const video = req.files['video'][0]; 
    
        if (file && video) {
            const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
            const videoUrl = `http://localhost:3000/uploads/${video.filename}`;
            const newVideo = new Videos({
                title: req.body.title,
                description: req.body.description,
                videoPath: videoUrl,
                videoContentImageUrl: fileUrl,
                categoryId: req.body.categoryId,
                userId: res.locals.user._id,
                channelId: req.body.channelId
            });
            await newVideo.save();

            const channel = await Channels.findOne({_id: req.body.channelId});
            channel.videos.push({
                videoId: newVideo._id
            });
            await channel.save();
        }
        res.redirect("/videos");
    } catch (error) {
        console.log(error);
    }
});

router.get("/edit/:id", [isAuth], csrf, async(req, res)=>{
    try {
        const video = await Videos.findOne({_id: req.params.id});
        const categories = await Category.find();
        res.render("editVideo", {video, categories});
    } catch (error) {
        console.log(error);
    }
});

router.post("/edit", [isAuth], upload.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async(req, res)=>{
    const file = req.files['file'] && req.files['file'][0]; 
    const video = req.files['video'] && req.files['video'][0]; 
    
    let data = {};
    if (file && video) {
        const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
        const videoUrl = `http://localhost:3000/uploads/${video.filename}`;
        data = {
            title: req.body.title,
            description: req.body.description,
            videoPath: videoUrl,
            videoContentImageUrl: fileUrl,
            categoryId: req.body.categoryId
        };
    }
    else{
        data = {
            title: req.body.title,
            description: req.body.description,
            categoryId: req.body.categoryId
        };
    }
    await Videos.findOneAndUpdate({_id: req.body.id}, data);
    return res.redirect("/videos");
});

router.get("/delete/:id", [isAuth], csrf, async(req, res)=>{
    res.render("deleteVideo");
});
router.post("/delete/:id", [isAuth], async(req, res)=>{
    await Videos.findOneAndDelete({_id: req.params.id});
    res.redirect("/videos");
})

// Video Like - UnLike - Views Operation Apis
router.get("/api/like", [isAuth], async(req, res)=>{
    const video = await Videos.findOne({_id: req.query.videoid});
    const isitUnLike = video.unLikeCount.find((item)=>item.userId==req.query.userid);
    if (isitUnLike) {
        const index = video.unLikeCount.indexOf(isitUnLike);
        video.unLikeCount.splice(index, 1);
    } else{
        const isitLike = video.likeCount.find((item)=>item.userId==req.query.userid);
        if (isitLike) {
            const index = video.likeCount.indexOf(isitLike);
            video.likeCount.splice(index, 1);
            
            return res.send({likeCount: video.likeCount.length, unLikeCount: video.unLikeCount.length});
        } 
    }
    video.likeCount.push({
        userId: req.query.userid
    });

    await video.save();
    res.send({likeCount: video.likeCount.length, unLikeCount: video.unLikeCount.length});
});

router.get("/api/unlike", [isAuth], async(req, res)=>{
    const video = await Videos.findOne({_id: req.query.videoid});
    const isitLike = video.likeCount.find((item)=>item.userId==req.query.userid);
    if (isitLike) {
        const index = video.likeCount.indexOf(isitLike);
        video.likeCount.splice(index, 1);
    } else{
        const isitUnLike = video.unLikeCount.find((item)=>item.userId==req.query.userid);
        if (isitUnLike) {
            const index = video.unLikeCount.indexOf(isitUnLike);
            console.log("beğenmeme Kaldırma kodu index: ", index);
            const deneme = video.unLikeCount.splice(index, 1);
            console.log("beğenmeme Kaldırma kodu deneme: ", deneme);
            await video.save();
            return res.send({unLikeCount: video.unLikeCount.length, likeCount: video.likeCount.length});
        }
    }
    
    video.unLikeCount.push({
        userId: req.query.userid
    });
    await video.save();
    res.send({unLikeCount: video.unLikeCount.length, likeCount: video.likeCount.length});
});

router.get("/api/views/:id", async(req, res)=>{
    const video = await Videos.findOne({_id: req.params.id});
    video.views += 1;
    await video.save();

    res.send({viewsCount: video.views});
});

module.exports = router;