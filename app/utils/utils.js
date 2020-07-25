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
 * Validate email address
 * @param {string} email
 * @return {boolean} isValid
 */
function validateEmail(email) {
  // eslint-disable-next-line max-len
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

let OTPList = [
  {email: 'e0424619@u.nus.edu', otp: '990811', exp: 1593439412204},
];

/**
 * Generates a random 6-digit number as a string,
 * and remove expired otps
 * @param {string} email - email
 * @return {string} OTP
 */
function generateOTP(email) {
  removeExpiredOTP();
  const otp = ((x) => x.length < 6 ? '0' * (6 - x.length) + x : x)(Math.floor(
      Math.random() * 1000000,
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
  // return true;
  console.log(OTPList);
  let res = false;
  OTPList.forEach((x) => {
    if (x.email === email) {
      if (x.otp === otp) {
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
  validateEmail,
  generateOTP,
  testOTP,
};
