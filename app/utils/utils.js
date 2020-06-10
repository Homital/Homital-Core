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

module.exports = {
  authenticateToken: authenticateToken,
  authenticateDevice: authenticateDevice,
};
