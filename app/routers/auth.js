const express = require('express');
const router = express.Router(); // Not my problem :P
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

router.post('/user/register', async (req, res) => {
  try {
    // console.log('?ASDFV');
    // console.log(`id: ${req.body.id}\nusername: ${req.body.username}\n
    // email: ${req.body.email}\npassword: ${req.body.password}`);
    const regRes = await db.functions.registerUser(
        req.body.username,
        req.body.email,
        req.body.password,
    );
    res.status(regRes.success ? 200 : 403).json(regRes);
  } catch (error) { // error in registration
    res.status(500).json({success: false, error: error.toString()});
  }
});

router.delete('/user/logout', (req, res) => {
  db.functions.removeRefreshToken(req.body.token, (err) => {
    if (err !== null) {
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
