var mongoose = require('mongoose');
var Status = require('./models/status');
var User = require('./models/user');

var dbusername = process.env.HOMITALDB_USERNAME;
var dbuserpassword = process.env.HOMITALDB_PASSWORD;
if (!dbusername || !dbuserpassword) {
    console.error(new Error('HOMITALDB_USERNAME or HOMITALDB_PASSWORD env var not set'));
    process.exit(1);
}
mongoose.connect(`mongodb://${dbusername}:${dbuserpassword}@ds045107.mlab.com:45107/homital`);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback){
  console.log("Connection Succeeded");
});

async function getUserByEmail (email) {
    //todo: get all instead of just one and return an error if got more than one
    var the_user;
    await User.findOne({'email': email}, (err, user) => {
        if (err) {
            console.log(err);
        }
        the_user = user;
    })
    return the_user;
}

async function getUserByUsername (username) {
    //todo: get all instead of just one and return an error if got more than one
    var the_user;
    await User.findOne({'username': username}, (err, user) => {
        if (err) {
            console.log(err);
        }
        the_user = user;
    })
    return the_user;
}

async function registerUser(username, email, password) {
    //no exisatance checking! to be fixed later
    //also no validation of input format
    var user = new User({
        username: username,
        email: email,
        password: password,
        email_verified: false   
    });
    await user.save();
    //todo: check for error from user.save()
    return {successful: true};
}

module.exports = {
    models: {
        Status: Status,
        User: User
    },
    functions: {
        getUserByEmail: getUserByEmail,
        getUserByUsername: getUserByUsername,
        registerUser: registerUser
    }
}