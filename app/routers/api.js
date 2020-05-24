const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/db');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');

const initializePassport = require('../passport-config');
initializePassport(passport, db.functions.getUserByEmail, db.functions.getUserByUsername);

router.use(express.json());
router.use(flash());
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
router.use(passport.initialize());
router.use(passport.session())

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));

router.get('/users', checkAuthenticated, (req, res) => res.json(["Alice","Bob","Charlie","Dave","Eve"]));

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
        var reg_res = await db.functions.registerUser(req.body.username, req.body.email, hashed_password);
        res.json(reg_res);
    } catch (error) {
        res.json({success: false, error: error.toString()});
    }
});

router.delete('/users/logout', checkAuthenticated, (req, res) => {
    req.logOut();
    res.json({success: true});
})

router.post('/users/login', passport.authenticate('local', {
    failureFlash: true
}), (req, res) => {
    res.json({success: true});
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

function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({success: false, error: "unauthenticated"});
}

module.exports = router;