const express = require("express");
const Shorts = require("../models/shorts");
const Users = require("../models/users");
const Category = require("../models/categories");
const Channels = require("../models/channels");
const csrf = require("../middleware/csrf");
const isAuth = require("../middleware/isAuth");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const router = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/shorts'); 
    },
    filename: (req, file, cb) => {
      const filename = `file_${Date.now()}-${file.originalname}`;
      cb(null, filename); 
    }
});
const upload = multer({ storage: storage });


router.get("/api", async(req, res)=>{
    try {
        const offset = req.query.offset && req.query.offset;
        const shorts = await Shorts.find().skip(offset).limit(1).exec();
        // const categories = await Category.find();

        res.send({shorts: shorts[0], offset: offset});
    } catch (error) {
        console.log(error);
    }
});

router.get("/", (req, res)=>{
    res.render("shorts/index", {user: res.locals.user});
});

router.get("/add", [isAuth], csrf, async(req, res)=>{
    try {
        const channels = await Channels.find({userId: res.locals.user._id});

        res.render("shorts/addShorts", {channels});
    } catch (error) {
        console.log(error);
    }
});

router.post("/add/api", [isAuth, upload.single("videourl")], async(req, res)=>{
    try {
        const video = req.file;
        const videoFileName = req.file && req.file.filename;
        const videoUrl = `http://localhost:3000/shorts/${videoFileName}`;
        console.log(video);
        if (video.mimetype == "video/mp4") {
            const duration = video.size / 180000;
            console.log("asdasd", duration);
            if (duration > 20) {
              return res.status(400).send("Videonuzun boyutu o kadar yüksek olamaz max 40 saniyelik video");
            }
        } else {
            return res.status(400).send("desteklenmiyen video formatı");
        }

        const newShorts = new Shorts({
            title: req.body.title,
            description: req.body.description,
            videoUrl: videoUrl,
            channelId: req.body.channelId,
            userId: res.locals.user._id,
        });
        // await newShorts.save();

        res.redirect("/shorts");
    } catch (error) {
        console.log(error);
    }
});

const checkVideoDuration = async(videoPath) =>{
    try {
        const duration = ffmpeg.ffprobe(videoPath, (err, metadata)=>{
            console.log(metadata);
            return metadata.format.duration;
        });
        // const command = ffmpeg(videoPath).output("pipe:").format("null");

        // const duration = await new Promise((resolve, reject)=>{
        //     ffmpeg.pipe(process.stdout, (err) => {
        //         if (err) {
        //           reject(err);
        //         } else {
        //           const match = err.toString().match(/Duration: (.*?), start: (.*?)/);
        //           if (match) {
        //             const durationString = match[1];
        //             const durationInSeconds = parseInt(durationString.split(":")[2]);
        //             resolve(durationInSeconds);
        //           } else {
        //             reject(new Error("Failed to parse video duration"));
        //           }
        //         }
        //     });
        // });
        return duration;
    } catch (error) {
        console.log(error);
    }
};

router.get("/like/api", async(req, res)=>{
    try {
        if (!req.query.userid && !req.query.shortid) {
            return res.send("Lütfen userid ve shortid bilgilerini giriniz");
        }
        const user = await Users.findOne({_id: req.query.userid});
        if (!user) {return res.send("Lütfen geçerli bir kullanıcı ile giriş yapın")};

        const short = await Shorts.findOne({_id: req.query.shortid});
        
        const isitUnlike = short.unLike.find((sh)=>sh.userId.toString()==req.query.userid);
        if (isitUnlike) {
            const index = short.unLike.findIndex((sh)=>sh.userId.toString()==req.query.userid);
            short.unLike.splice(index, 1);
        } else {
            const isitLike = short.like.find((sh)=>sh.userId.toString() == req.query.userid);
            if (isitLike) {
                const index = short.like.findIndex((sh)=>sh.userId.toString()==req.query.userid);
                short.like.splice(index, 1);
                return res.send({likeCount: short.like.length, unLikeCount: short.unLike.length});
            }
        }
        short.like.push({userId: req.query.userid});


        await short.save();

        res.send({likeCount: short.like.length, unLikeCount: short.unLike.length});
    } catch (error) {
        console.log(error);
    }
});

router.get("/unlike/api", async(req, res)=>{
    try {
        if (!req.query.userid && !req.query.shortid) {
            return res.send("Lütfen userid ve shortid bilgilerini giriniz");
        }
        const user = await Users.findOne({_id: req.query.userid});
        if (!user) {
            return res.send("Geçerli bir kullanıcı");
        }
        const short = await Shorts.findOne({_id: req.query.shortid});

        const isitLike = short.like.find((sh)=>sh.userId.toString()==req.query.userid);
        if (isitLike) {
            const index = short.like.findIndex((sh)=>sh.userId.toString() == req.query.userid);
            short.like.splice(index, 1);
        } else {
            const isitUnLike = short.unLike.find((sh)=>sh.userId.toString() == req.query.userid);
            if (isitUnLike) {
                const index = short.unLike.findIndex((sh)=>sh.userId.toString() == req.query.userid);
                short.unLike.splice(index, 1);
                return res.send({likeCount: short.like.length, unLikeCount: short.unLike.length});
            }
        }
        short.unLike.push({userId: req.query.userid});

        await short.save();

        res.send({likeCount: short.like.length, unLikeCount: short.unLike.length});
    } catch (error) {
        console.log(error);
    }
});


router.get("/views/api", async(req, res)=>{
    try {
        const short = await Shorts.findOne({_id: req.query.shortid});
        if (!short) {
            return res.send("Geçerli bir short idsi giriniz");
        }

        short.views = short.views + 1;

        await short.save();

        res.send({views: short.views});
    } catch (error) {
        console.log(error);
    }
}); 


router.post("/addcomment/api", async(req, res)=>{
    try {
        if (!req.query.shortid && !req.query.userid) {
            return res.send("lütfen bilgilerinizi eksiksiz giriniz");
        }
        const short = await Shorts.findOne({_id: req.query.shortid});
        if (!short) {
            return res.send("Lütfen geçerli bir shortidsi giriniz");
        }

        short.comments.push({userId: req.query.userid, comment: req.body.comment});

        await short.save();

        res.send(short.comments);
    } catch (error) {
        console.log(error);
    }
}); 

module.exports = router;