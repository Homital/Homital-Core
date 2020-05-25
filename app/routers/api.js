const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/db');
const passport = require('passport');
//const flash = require('express-flash');
const jwt = require('jsonwebtoken');
//const session = require('express-session');

const initializePassport = require('../passport-config');
initializePassport(passport, db.functions.getUserByEmail, db.functions.getUserByUsername);

router.use(express.json());
//router.use(flash());
/*
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
*/
router.use(passport.initialize());
//router.use(passport.session())

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));

router.get('/users', authenticateToken , (req, res) => {
    res.json({user: req.user, users: ["Alice","Bob","Charlie","Dave","Eve"]});
});

router.get('/users/:username/rooms', (req, res) =>
    res.json(["livingroom", "bedroom", "kitchen"])
);

router.get('/users/:username/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/users/:username/:roomname/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/users/:username/:roomname/:devicename', (req, res) => {
    db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: {power: status.power}});
    });
});

router.get('/users/:username/:roomname/:devicename/actions', (req, res) => res.json(["poweron", "poweroff"]));

router.post('/users/:username/:roomname/:devicename/:actionname', (req, res) => {
    if (req.params.actionname == 'poweron') {
        db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
            if (err) {
                console.error(err);
                res.status(404).json({success: false, error: err.toString()});
            } 
            status.power = true;
            status.save(error => {
                if (error) {
                    console.error(error);
                    res.status(404).json({success: false, error: error.toString()});
                }
                res.json({success: true});
            });
        });
    } else if (req.params.actionname == 'poweroff') {
        db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
            if (err) {
                console.error(err);
                res.status(404).json({success: false, error: err.toString()});
            } 
            status.power = false;
            status.save(error => {
                if (error) {
                    console.error(error);
                    res.status(404).json({success: false, error: error.toString()});
                }
                res.json({success: true});
            });
        });
    }
});

function authenticateToken (req, res, next) {
    const auth_header = req.headers['authorization'];
    const token = auth_header && auth_header.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    })
}

router.post('/users/register', async (req, res) => {
    try {
        console.log(`id: ${req.body.id}\nusername: ${req.body.username}\nemail: ${req.body.email}\npassword: ${req.body.password}`);
        const hashed_password = await bcrypt.hash(req.body.password, 10);
        if (await db.functions.getUserByUsername(req.body.username) != null) {
            console.log(await db.functions.getUserByUsername(req.body.username))
            res.json({success: false, error: "username already registered"});
        } else if (await db.functions.getUserByEmail(req.body.email) != null) {
            res.json({success: false, error: "email already registered"});
        }
        let reg_res = await db.functions.registerUser(req.body.username, req.body.email, hashed_password);
        res.json(reg_res);
    } catch (error) {
        res.json({success: false, error: error.toString()});
    }
});

router.delete('/users/logout', (req, res) => {
    db.functions.removeRefreshToken(req.body.token, err => {
        if (err != null) {
            console.log("got err...")
            return res.status(403).json({success: false, error: err});
        }
        res.json({success: true});
    });
})

router.post('/users/login', passport.authenticate('local', {
    session: false
}), (req, res) => {
    const user = {username: req.user.username};
    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);
    db.functions.pushRefreshToken(refresh_token);
    res.json({success: true, access_token: access_token, refresh_token: refresh_token});
});

router.post('/users/token', (req, res) => {
    const refresh_token = req.body.token;
    if (refresh_token == null) {
        return res.sendStatus(401);
    }
    db.functions.checkRefreshToken(refresh_token, (err) => {
        if (err != null) {
            return res.status(403).json({success: false, error: err});
        }
        jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            const access_token = generateAccessToken({username: user.username});
            res.json({access_token: access_token});
        });
    }, (err) => {res.status(403).json({success: false, error: err})});
    
});

function generateAccessToken (user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10s'});
}

function generateRefreshToken (user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

module.exports = router;