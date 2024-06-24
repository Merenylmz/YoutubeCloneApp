const express = require("express");
const Category = require("../models/categories");
const router = express.Router();

router.get("/", async(req, res)=>{
    const categories = await Category.find();

    res.render("categories/categoryList", {categories});
});

router.get("/add", async(req, res)=>{
    res.render("categories/addCategory");
});

router.post("/add", async(req, res)=>{
    const newCategory = new Category({
        name: req.body.name
    });
    await newCategory.save();

    res.redirect("/categories");
});

router.get("/delete/:id", async(req, res)=>{

    res.render("categories/deleteCategory");
});

router.post("/delete/:id", async(req, res)=>{
    await Category.findOneAndDelete({_id: req.params.id});

    res.redirect("/categories");
});


router.get("/edit/:id", async(req, res)=>{
    const category = await Category.findOne({_id: req.params.id});

    res.render("categories/editCategory", {category});
});
router.post("/edit/:id", async(req, res)=>{
    const category = await Category.findOne({_id: req.params.id});
    category.name = req.body.name;
    await category.save();

    res.redirect("/categories");
});


module.exports = router;