module.exports = (req, res, next) =>{
    res.locals.isAuth = req.session.isAuth;
    res.locals.isAdmin = req.session.isAdmin;
    res.locals.user = req.session.user;
    next();
}