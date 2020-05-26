const mongoose = require('mongoose');
const Status = require('./models/status');
const User = require('./models/user');
const Token = require('./models/token');

const dbusername = process.env.HOMITALDB_USERNAME;
const dbuserpassword = process.env.HOMITALDB_PASSWORD;
if (!dbusername || !dbuserpassword) {
    console.error(new Error('HOMITALDB_USERNAME or HOMITALDB_PASSWORD env var not set'));
    process.exit(1);
}
mongoose.connect(`mongodb://${dbusername}:${dbuserpassword}@ds045107.mlab.com:45107/homital`);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback){
  console.log("Connection Successful");
});

async function getUserByEmail (email) {
    //todo: get all instead of just one and return an error if got more than one
    let the_user;
    await User.findOne({email: email}, (err, user) => {
        if (err) {
            console.log(err);
        }
        console.log("getUserByEmail:", user)
        the_user = user;
    })
    return the_user;
}

async function getUserByUsername (username) {
    //todo: get all instead of just one and return an error if got more than one
    let the_user;
    await User.findOne({username: username}, (err, user) => {
        if (err) {
            console.log(err);
        }
        the_user = user;
    });
    return the_user;
}

async function registerUser(username, email, password) {
    //no exisatance checking! to be fixed later
    //also no validation of input format
    let user = new User({
        username: username,
        email: email,
        password: password,
        email_verified: false
    });
    await user.save();
    //todo: check for error from user.save()
    return {successful: true};
}

async function pushRefreshToken(token) {
    let toke = new Token({token: token});
    await toke.save();
    //todo: check for errs
    return {successful: true};
}

async function checkRefreshToken(token, callback) {
    await Token.findOne({token: token}, (err, tok) => {
        if (err) {
            return callback(err.toString());
        }
        if (tok === null) {
            return callback("refresh token not authorized");
        }
        return callback(null);
    });
}

function removeRefreshToken(token, callback) {
    Token.findOneAndDelete({token: token}, (err, tok) => {
        if (err) {
            return callback(err.toString());
        }
        if (tok === null) {
            return callback("refresh token not authorized");
        }
        return callback(null);
    });
}

module.exports = {
    models: {
        Status: Status,
        User: User
    },
    functions: {
        getUserByEmail: getUserByEmail,
        getUserByUsername: getUserByUsername,
        registerUser: registerUser,
        pushRefreshToken: pushRefreshToken,
        checkRefreshToken: checkRefreshToken,
        removeRefreshToken: removeRefreshToken
    }
}