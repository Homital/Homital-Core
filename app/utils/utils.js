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

module.exports = {
    authenticateToken: authenticateToken
};