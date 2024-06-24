const express = require("express");
const csrf = require("../middleware/csrf");
const router = express.Router();
const Users = require("../models/users");
const bcrypt = require("bcrypt");
const isAuth = require("../middleware/isAuth");

router.get("/login", csrf, (req, res)=>{
    res.render("auth/login");
});

router.post("/login", async(req, res)=>{
    try {
        const user = await Users.findOne({email: req.body.email});
        if (!user) {
            return res.redirect("/register");
        }

        const match = await bcrypt.compare(req.body.password, user.password);
        if (match) {
            req.session.isAuth = true;
            req.session.isAdmin = user.isAdmin;
            req.session.user = user;
            
            if (req.query.redirect) {
                return res.redirect(req.query.redirect);
            }
            return res.redirect("/videos");
        }
        res.redirect("/?status=false");
    } catch (error) {
        console.log(error);
    }
}); 


router.get("/register", csrf, (req, res)=>{
    res.render("auth/register");
});

router.post("/register", async(req, res)=>{
    try {
        const user = await Users.findOne({email: req.body.email});
        if (user) {
            return res.redirect("/");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new Users({
            userName: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });

        await newUser.save();

        res.redirect("/login");
    } catch (error) {
        console.log(error);
    }
});

router.get("/logout", async(req, res)=>{
    try {
        await req.session.destroy();
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});


module.exports = router;