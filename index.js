const express = require("express");
const app = express();
const mongoose = require("mongoose");
const videosRouter = require("./routes/videos");
const authRouter = require("./routes/users");
const commentsRouter = require("./routes/comments");
const categoriesRouter = require("./routes/categories");
const path = require("path");
const Videos = require("./models/videos");
const locals = require("./middleware/locals");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(expressSession);
const cors = require("cors");
const isAuth = require("./middleware/isAuth");
const isAdmin = require("./middleware/isAdmin");
const csrf = require("./middleware/csrf");
const Users = require("./models/users");
const channelRoutes = require("./routes/channels");
const shortsRoutes = require("./routes/shorts");
const Channels = require("./models/channels");
const Category = require("./models/categories");

app.use(cookieParser());
app.use(expressSession({
    secret: "hello world",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    },  
    store: new MongoDBStore({
        uri: "mongodb+srv://eren28:28eren57@cluster0.n2gcnhz.mongodb.net/videosDb?retryWrites=true&w=majority",
        collection: "Sessions"
    })
}))
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
// app.use(cors({
//     methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
//     origin: "*",
// }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use("/logos", express.static(path.join(__dirname, 'public/logos')));
app.use("/shorts", express.static(path.join(__dirname, "public/shorts")));
app.use(locals);
app.use(csurf());


app.get("/", async(req, res)=>{
    const videos = await Videos.find();
    const categories = await Category.find();
    res.render("index", {videos, categories});
});

app.use("/comments", commentsRouter);
app.use("/categories", [isAuth, isAdmin], csrf, categoriesRouter);
app.use("/videos", videosRouter);
app.use("/shorts", shortsRoutes);
app.use("/", authRouter);
app.use("/channels", channelRoutes);
app.get("/details/:id", csrf, async(req, res)=>{
    try {
        const video = await Videos.findOne({_id: req.params.id});
        const channel = await Channels.findOne({_id: video.channelId});
        res.render("details", {video, user: res.locals.user, channel});
    } catch (error) {
        console.log(error);
    }
});
app.get("/user/:id", async(req, res)=>{
    try {
        const user = await Users.findOne({_id: req.params.id});

        res.send(user);
    } catch (error) {
        console.log(error);
    }
});

mongoose.connect("mongodb+srv://eren28:28eren57@cluster0.n2gcnhz.mongodb.net/videosDb?retryWrites=true&w=majority")
    .then(()=>{
        console.log("MongoDb Connected");
        app.listen(3000, ()=>console.log("Listening a Port http://localhost:3000/"));
    }).catch((e)=>console.log("MongoDb connection failed", e));