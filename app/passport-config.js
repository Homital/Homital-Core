const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize (passport, getUserByEmail, getUserByUsername) {
    const authenticateUser = async (username_or_email, password, done) => {
        //console.log(`ue: ${username_or_email}, pw: ${password}`)
        var user = await getUserByUsername(username_or_email);
        if (user == null) {
            console.log("username does not exist")
            user = await getUserByEmail(username_or_email);
            if (user == null) {
                console.log("email does not exist")
                return done(null, false, {message: "User does not exist"});
            }
        }
        console.log(user)
        try {
            if (await bcrypt.compare(password, user.password)) {
                console.log("pswd correct")
                return done(null, user);
            } else {
                console.log("pswd incorrect")
                return done(null, false, {message: "Password incorrect"});
            }
        } catch (e) {
            console.log("pswd compare err")
            return done(e);
        }
    }
    passport.use(new LocalStrategy({
        usernameField: 'username_or_email',
        passwordField: 'password'
    }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.username));
    passport.deserializeUser((username, done) => done(null, getUserByUsername(username)));
}

module.exports = initialize;