const jwt = require('jsonwebtoken');

function authenticateToken (req, res, next) {
    const auth_header = req.headers['authorization'];
    const token = auth_header && auth_header.split(' ')[1];
    if (token === null) {
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

//to be changed to jwt
//maybe the middleware can be returned by another function for more detailed authorization
//or append the device's props to request object
function authenticateDevice(req, res, next) {
    const auth_header = req.headers['authorization'];
    const token = auth_header && auth_header.split(' ')[1];
    if (token === null) {
        return res.sendStatus(401);
    }
    if (token === 'homital-l0') {
        req.deviceid = 'qwertyuiop';
        next();
        return;
    } else {
        res.status(403).json({success: false, error: "authentication token not recognized"});
        return;
    }
}

module.exports = {
    authenticateToken: authenticateToken,
    authenticateDevice: authenticateDevice
};