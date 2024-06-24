module.exports = (req, res, next) =>{
    if (!req.session.isAdmin) {
        return res.send("Buraya erişim izniniz yok");
    }
    next();
}