const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router(); // Not my problem :P
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const nodemailer = require('nodemailer');
const utils = require('../utils/utils');

// Following doc
router.post('/user/getotp', (req, res) => {
  if (!req.body.email) {
    res.status(400).json({
      error: 'email not provided',
    });
    return;
  }
  if (!utils.validateEmail(req.body.email)) {
    res.status(422).json({
      error: 'email validation failed',
      invalid_field: 'email',
    });
    return;
  }
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
      res.status(500).json({
        error: 'Error logging in',
      });
      return;
    } else {
      console.log('SMTP server is ready to take our messages');
      const otp = utils.generateOTP(req.body.email);
      transporter.sendMail({
        to: req.body.email,
        subject: 'Here Is Your Homital OTP',
        text: otp,
        html: `<h1>OTP for Homital</h1>
        <p>Someone,
        perhaps you,
        has requested for an OTP for this email address</p>
        <p>Your OTP is:</p>
        <p>${otp}</p>
        <p>Ignore this email if you do not know what it is for</p>`,
      }, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({
            error: 'Error sending email',
          });
          return;
        } else {
          res.json('success');
          return;
        }
      });
    }
  });
});

// Following doc
router.post('/user/register', async (req, res) => {
  try {
    // console.log('in post(register)');
    // console.log(`username: ${req.body.username}\n
    // email: ${req.body.email}\npassword: ${req.body.password}`);
    if (
      !req.body.username ||
      !req.body.email ||
      !req.body.password ||
      !req.body.otp
    ) {
      res.status(400).json({
        error: 'Request body missing required fields',
      });
      return;
    }
    if (utils.testOTP(req.body.email, req.body.otp)) {
      const regRes = await db.functions.registerUser(
          req.body.username,
          req.body.email,
          req.body.password,
      );
      if (regRes.success) {
        res.json('success');
      } else {
        res.status(500).json({
          error: regRes.error,
        });
      }
      return;
    } else {
      res.status(403).json({
        error: 'wrong OTP',
      });
      return;
    }
  } catch (error) { // error in registration
    res.status(500).json({
      error: error.toString(),
    });
  }
});

// POST /user/login?by=email/username
// Following doc
router.post('/user/login', async (req, res, next) => { // look up the user in db
  if (req.query.by === 'email') {
    if (!req.body.email) {
      res.status(400).json({
        error: 'Missing email',
      });
      return;
    }
    req.user = await db.functions.getUserByEmail(req.body.email);
  } else if (req.query.by === 'username') {
    if (!req.body.username) {
      res.status(400).json({
        error: 'Missing usernmae',
      });
      return;
    }
    req.user = await db.functions.getUserByUsername(req.body.username);
  } else {
    return res.status(501).json({
      error: 'requested login method not supported',
    });
  }
  if (req.user === null) {
    return res.status(404).json({
      error: 'username or email does not exist',
    });
  }
  next();
}, async (req, res, next) => { // user found, compare password here
  try {
    if (await bcrypt.compare(req.body.password, req.user.password)) {
      next();
    } else {
      res.status(403).json({
        error: 'Incorrect password',
      });
      return;
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: 'unknown, devs are working on it...', // Nah
    });
    return;
  }
}, async (req, res) => { // no error
  console.log(req.user);
  const user = {username: req.user.username};
  const refreshToken = generateRefreshToken(user);
  await db.functions.pushRefreshToken(refreshToken);
  res.json({
    refresh_token: refreshToken,
    access_token: generateAccessToken(user),
  });
});

// Following doc
router.post('/user/token', (req, res) => {
  const refreshToken = req.body.refresh_token;
  if (refreshToken === null) {
    res.status(400).json({error: 'refresh_token not provided'});
    return;
  }
  db.functions.checkRefreshToken(refreshToken, (err) => {
    if (err) {
      res.status(404).json({error: err});
      return;
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        res.status(500).json({error: 'JWT verification error???'});
        return;
      }
      const accessToken = generateAccessToken({username: user.username});
      res.json({access_token: accessToken});
    });
  });
});

// Following doc
router.post('/user/logout', (req, res) => {
  db.functions.removeRefreshToken(req.body.refresh_token, (err) => {
    if (err !== null) {
      // console.log("got err...")
      return res.status(404).json({error: err});
    }
    res.json('success');
  });
});

// Following doc
router.post('/user/fgtpswd', async (req, res) => {
  if (utils.testOTP(req.body.email, req.body.otp)) {
    const newPassword = Math.random().toString(36).substring(2, 10); // 8dig str
    const rrr = await db.functions.changePassword(req.body.email, newPassword);
    if (rrr === 200) {
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
          res.status(500).json({
            error: 'Error logging in',
          });
          return;
        } else {
          console.log('SMTP server is ready to take our messages');
          transporter.sendMail({
            to: req.body.email,
            subject: 'Reset Password',
            text: newPassword,
            html: `<h1>Your temporary password for Homital is:</h1>
            <p>${newPassword}</p>`,
          }, (error, info) => {
            if (error) {
              console.log(error);
              res.status(500).json({
                error: 'Error sending email',
              });
              return;
            } else {
              res.json('success');
              return;
            }
          });
        }
      });
    } else if (rrr === 500) {
      res.status(500).json({
        error: 'Internal server error :<',
      });
      return;
    } else if (rrr === 404) {
      res.status(404).json({
        error: 'Not found',
      });
      return;
    }
  } else {
    res.status(403).json({
      error: 'Wrong OTP',
    });
    return;
  }
});

// Following doc
router.post('/user/updatepswd', async (req, res, next) => { // look up the user
  if (!req.body.email) {
    res.status(400).json({
      error: 'Missing email',
    });
    return;
  }
  req.user = await db.functions.getUserByEmail(req.body.email);
  if (req.user === null) {
    return res.status(404).json({
      error: 'username or email does not exist',
    });
  }
  next();
}, async (req, res, next) => { // user found, compare password here
  try {
    if (await bcrypt.compare(req.body.old_password, req.user.password)) {
      next();
    } else {
      res.status(403).json({
        error: 'Incorrect password',
      });
      return;
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: 'unknown, devs are working on it...', // Nah
    });
    return;
  }
}, async (req, res) => {
  const rrr = db.functions.changePassword(
      req.body.email,
      req.body.new_password,
  );
  if (rrr === 200) {
    res.json('success');
  } else if (rrr === 500) {
    res.status(500).json({
      error: 'Internal server error',
    });
  } else if (rrr === 404) {
    res.status(404).json({
      error: 'Not found',
    });
  }
  return;
});

/**
 * Generates an access token for the given username
 * @param {object} user - {username: *}
 * @return {string} access token
 */
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});
}

/**
 * Generates a refresh token for the given username
 * @param {object} user - {username: *}
 * @return {string} refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

module.exports = router;
