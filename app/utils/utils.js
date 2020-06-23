const jwt = require('jsonwebtoken');

/**
 * Middleware for authenticating JWT tokens
 * @param {Request} req - request
 * @param {Response} res - response
 * @param {RequestHandler} next - next middleware to be called // import type!
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null) {
    res.sendStatus(401);
    return;
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    req.user = user;
    next();
  });
}

/**
 * to be changed to jwt
 * maybe the middleware can be returned by another function
 * for more detailed authorization
 * or append the device's props to request object
 * @param {Request} req - request
 * @param {Response} res - response
 * @param {RequestHandler} next - next middleware to be called // import type!
 */
function authenticateDevice(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null) {
    res.sendStatus(401);
    return;
  }
  if (token === 'homital-l0') {
    req.deviceid = 'qwertyuiop';
    next();
    return;
  } else {
    res.status(403).json({
      success: false, error: 'authentication token not recognized'},
    );
    return;
  }
}

let OTPList = [];

/**
 * Generates a random 6-digit number as a string,
 * and remove expired otps
 * @param {string} email - email
 * @return {string} OTP
 */
function generateOTP(email) {
  removeExpiredOTP();
  const otp = ((x) => x.length<6 ? '0'*(6-x.length)+x : x)(Math.floor(
      Math.random()*1000000,
  ).toString());
  OTPList.push({
    email: email,
    otp: otp,
    exp: new Date().getTime() + 1000 * 60 * 30, // 30 minutes after now
  });
  return otp;
}

/**
 * Validates the OTP.
 * @param {string} email
 * @param {string} otp
 * @return {boolean} validation result
 */
function testOTP(email, otp) {
  let res = false;
  OTPList.forEach((x) => {
    if (x.email === email) {
      if (x.otp == otp) {
        res = true;
      }
    }
  });
  removeExpiredOTP();
  return res;
}

/**
 * Remove expired OTPs.
 */
function removeExpiredOTP() {
  OTPList = OTPList.filter((x) => x.exp < new Date().getTime());
}

module.exports = {
  authenticateToken,
  authenticateDevice,
  generateOTP,
  testOTP,
};
