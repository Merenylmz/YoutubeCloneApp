const express = require("express");
const router = express.Router();
const Channels = require("../models/channels");
const csrf = require("../middleware/csrf");
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const multer = require("multer");
const Videos = require("../models/videos");
const Category = require("../models/categories");

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, "public/logos");
    },
    filename: (req, file, cb) => {
        const filename = `logo_${Date.now()}-${file.originalname}`;
        cb(null, filename); 
    }
});

const upload = multer({storage: storage});


router.get("/", async(req, res)=>{
    try {
        const channels = await Channels.find();
        const categories = await Category.find();

        res.render("channels/index", {channels, isAuth: res.locals.isAuth, userid: res.locals.user && res.locals.user._id, categories});

    } catch (error) {
        console.log(error);
    }
});

router.get("/list", [isAuth], csrf, async(req, res)=>{
    try {
        let channels = [];

        if (res.locals.isAuth && res.locals.isAdmin) {
            channels = await Channels.find();
        } else{
            channels = await Channels.find({userId: res.locals.user._id});
        }
        res.render("channels/channelList", {channels});
    } catch (error) {
        console.log(error);
    }
});

router.get("/add", csrf, async(req, res)=>{
    try {
        if (!res.locals.user) {
            return res.redirect("/channels?info=authrequired");
        }
        res.render("channels/add", {userid: res.locals.user ? res.locals.user._id: "-1"});
    } catch (error) {
        console.log(error);
    }
});

router.post("/add", upload.fields([{name: "logoPath", maxCount: 1}]), async(req, res)=>{
    try {
        const logoPath = req.files && req.files["logoPath"][0].filename;

        if (logoPath) {
            const logoUrl = `http://localhost:3000/logos/${logoPath}`;
            const newChannel = new Channels({
                title: req.body.title,
                description: req.body.description,
                logoPath: logoUrl ? logoUrl : null,
                userId: req.query.userid,
            });
            await newChannel.save();
        }
        
        res.redirect("/channels");
    } catch (error) {
        console.log(error);
    }
});

router.get("/details/:id", async(req, res)=>{
    const channel = await Channels.findOne({_id: req.params.id});
    const videos = await Videos.find({channelId: req.params.id});

    res.render("channels/details", {channel, videos, userid: res.locals.user ? res.locals.user._id : -1});
});

router.get("/edit/:id", csrf, async(req, res)=>{
    const channel = await Channels.findOne({_id: req.params.id});

    res.render("channels/edit", {channel});
});

router.post("/edit/:id", csrf, upload.fields([{name: "logoPath", maxCount: 1}]), async(req, res)=>{
    const channel = await Channels.findOne({_id: req.params.id});
    const logoPath = req.files["logoPath"] && req.files["logoPath"][0].filename;

    if (logoPath) {
        const logoUrl = `http://localhost:3000/logos/${logoPath}`;
        channel.title = req.body.title
        channel.description = req.body.description
        channel.logoPath = logoUrl ? logoUrl : null
    } else{
        channel.title = req.body.title;
        channel.description = req.body.description;
        channel.logoPath = req.body.logoUrl;
    }
    
    await channel.save();
    res.redirect("/channels");
});

router.get("/subscribes", async(req, res)=>{
    const channel = await Channels.findOne({_id: req.query.channelid});
    const isitSubscribed = channel.subscribes.find((item)=>item.userId == req.query.userid);
    let subscribesState = true;
    if (isitSubscribed) {
        const index = channel.subscribes.indexOf(isitSubscribed);
        channel.subscribes.splice(index, 1);
        await channel.save();
        subscribesState = false;
        return res.send({subscribesCount: channel.subscribes.length});
    }
    channel.subscribes.push({
        userId: req.query.userid
    });

    await channel.save();
    res.send({subscribesCount: channel.subscribes.length, "state": subscribesState});
});

router.delete("/api/:id", csrf, async(req, res)=>{
    try {
        const channel = await Channels.findOne({_id: req.params.id});
        if (res.locals.isAdmin) {
            channel.videos.forEach(async(video)=>{
                await Videos.findOneAndDelete({_id: video.videoId});
            });
            await Channels.findOneAndDelete({_id: req.params.id});
        } else {
            const channel = await Channels.findOne({_id: req.params.id});
            if (channel.userId != res.locals.user._id) {
                return res.send({txt: "Erişiminiz Yok"});
            }
            channel.videos.forEach(async(video)=>{
                await Videos.findOneAndDelete({_id: video.videoId});
            }); 
            await Channels.findOneAndDelete({_id: req.params.id});
        }
        
        res.send(true);
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;