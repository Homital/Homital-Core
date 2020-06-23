const express = require('express');
const router = express.Router(); // Not my problem :P
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const nodemailer = require('nodemailer');
const utils = require('../utils/utils');

router.post('/user/getotp', (req, res) => {
  const transporter = nodemailer.createTransport({
    host: process.env.NOREPLY_EMAIL_HOST,
    port: parseInt(process.env.NOREPLY_EMAIL_PORT, 10),
    secure: true,
    auth: {
      user: process.env.NOREPLY_EMAIL_ADDR,
      pass: process.env.NOREPLY_EMAIL_PASS,
    },
  }, {
    from: process.env.NOREPLY_EMAIL_ADDR,
  });
  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
      res.json({
        success: false,
        error: 'Error during verification',
      });
    } else {
      console.log('SMTP server is ready to take our messages');
      const otp = utils.generateOTP(req.body.email);
      transporter.sendMail({
        to: req.body.email,
        subject: 'Here Is Your Homital OTP',
        text: otp,
        html: `<h1>Your OTP for Homital is:</h1><p>${otp}</p>`,
      }, (error, info) => {
        if (error) {
          console.log(error);
          res.json({
            success: false,
            error: 'Error sending email',
          });
        } else {
          res.json({success: true});
        }
      });
    }
  });
});

router.post('/user/register', async (req, res) => {
  try {
    // console.log('in post(register)');
    // console.log(`id: ${req.body.id}\nusername: ${req.body.username}\n
    // email: ${req.body.email}\npassword: ${req.body.password}`);

    // to be moved to db functions
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // username exists
    if (await db.functions.getUserByUsername(req.body.username) != null) {
      // console.log(1);
      // console.log(await db.functions.getUserByUsername(req.body.username))
      res.status(403).json({
        success: false,
        error: 'username already registered',
      });
      // email exists
    } else if (await db.functions.getUserByEmail(req.body.email) != null) {
      // console.log(2);
      res.status(403).json({
        success: false,
        error: 'email already registered',
      });
    }
    // console.log(3);
    if (utils.testOTP(req.body.email, req.body.otp)) {
      // console.log(4);
      const regRes = await db.functions.registerUser(
          req.body.username,
          req.body.email,
          hashedPassword,
      );
      res.json({success: regRes === 0});
    } else {
      // console.log(5);
      res.status(403).json({
        success: false,
        error: 'wrong OTP',
      });
    }
  } catch (error) { // error in registration
    // console.log(6);
    res.status(500).json({success: false, error: error.toString()});
  }
});

router.delete('/user/logout', (req, res) => {
  db.functions.removeRefreshToken(req.body.token, (err) => {
    if (err != null) {
      // console.log("got err...")
      return res.status(403).json({success: false, error: err});
    }
    res.json({success: true});
  });
});

// POST /user/login?by=email/username
// data validity checking (must be json)
router.post('/user/login', async (req, res, next) => { // look up the user in db
  if (req.query.by === 'email') {
    req.user = await db.functions.getUserByEmail(req.body.email);
  } else if (req.query.by === 'username') {
    req.user = await db.functions.getUserByUsername(req.body.username);
  } else {
    return res.status(403).json({
      success: false,
      error: 'requested login method not supported',
    });
  }
  if (req.user === null) {
    return res.status(403).json({
      success: false,
      error: 'username or email does not exist',
    });
  }
  next();
}, async (req, res, next) => { // user found, compare password here
  try {
    if (await bcrypt.compare(req.body.password, req.user.password)) {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        error: 'incorrect password',
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      error: 'unknown, devs are working on it...', // Nah
    });
  }
}, async (req, res) => { // no error
  console.log(req.user);
  const user = {username: req.user.username};
  const refreshToken = generateRefreshToken(user);
  await db.functions.pushRefreshToken(refreshToken);
  res.json({success: true, refreshToken: refreshToken});
});

router.post('/user/token', (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken === null) {
    return res.status(401).json({success: false, error: '?'});
  }
  db.functions.checkRefreshToken(refreshToken, (err) => {
    if (err) {
      return res.status(403).json({success: false, error: err});
    }
    jwt.verify(refreshToken, process.env.REFRESHTOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({success: false, error: '?'});
      }
      const accessToken = generateAccessToken({username: user.username});
      res.json({success: true, accessToken: accessToken});
    });
  }, (err) => {
    res.status(403).json({success: false, error: err});
  });
});

/**
 * Generates an access token for the given username
 * @param {string} user - username
 * @return {string} access token
 */
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2m'});
}

/**
 * Generates a refresh token for the given username
 * @param {string} user - username
 * @return {string} refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESHTOKEN_SECRET);
}

module.exports = router;
