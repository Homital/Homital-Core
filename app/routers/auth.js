const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

router.post('/user/register', async (req, res) => {
    try {
        console.log('?ASDFV')
        //console.log(`id: ${req.body.id}\nusername: ${req.body.username}\nemail: ${req.body.email}\npassword: ${req.body.password}`);
        const hashed_password = await bcrypt.hash(req.body.password, 10); //to be moved to db functions
        if (await db.functions.getUserByUsername(req.body.username) != null) { //username exists
            //console.log(await db.functions.getUserByUsername(req.body.username))
            res.status(403).json({success: false, error: "username already registered"});
        } else if (await db.functions.getUserByEmail(req.body.email) != null) { //email exists
            res.status(403).json({success: false, error: "email already registered"});
        }
        let reg_res = await db.functions.registerUser(req.body.username, req.body.email, hashed_password);
        res.json(reg_res);
    } catch (error) { //error in registration
        res.status(500).json({success: false, error: error.toString()});
    }
});

router.delete('/user/logout', (req, res) => {
    db.functions.removeRefreshToken(req.body.token, err => {
        if (err != null) {
            //console.log("got err...")
            return res.status(403).json({success: false, error: err});
        }
        res.json({success: true});
    });
})

//POST /user/login?by=email/username
//data validity checking (must be json)
router.post('/user/login', async (req, res, next) => { //look up the user in db
    if (req.query.by === 'email') {
        req.user = await db.functions.getUserByEmail(req.body.email);
    } else if (req.query.by === 'username') {
        req.user = await db.functions.getUserByUsername(req.body.username);
    } else {
        return res.status(403).json({success: false, error: "requested login method not supported"});
    }
    if (req.user === null) {
        return res.status(403).json({success: false, error: "username or email does not exist"});
    }
    next();
}, async (req, res, next) => { //user found, compare password here
    try {
        if (await bcrypt.compare(req.body.password, req.user.password)) {
            return next();
        } else {
            return res.status(403).json({success: false, error: "incorrect password"});
        }
    } catch (e) {
        return res.status(500).json({success: false, error: "unknown, devs are working on it..."});
    }
}, (req, res) => { //no error
    const user = {username: req.user.username};
    const refresh_token = generateRefreshToken(user);
    db.functions.pushRefreshToken(refresh_token);
    res.json({success: true, refresh_token: refresh_token});
});

router.post('/user/token', (req, res) => {
    const refresh_token = req.body.token;
    if (refresh_token === null) {
        return res.status(401).json({success: false, error: "?"});
    }
    db.functions.checkRefreshToken(refresh_token, (err) => {
        if (err) {
            return res.status(403).json({success: false, error: err});
        }
        jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({success: false, error: "?"});
            }
            const access_token = generateAccessToken({username: user.username});
            res.json({success: true, access_token: access_token});
        });
    }, (err) => {res.status(403).json({success: false, error: err})});
    
});

function generateAccessToken (user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2m'});
}

function generateRefreshToken (user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

module.exports = router;