const mongoose = require('mongoose');
const Status = require('./models/status');
const User = require('./models/user');
const Token = require('./models/token');
const bcrypt = require('bcrypt');

const dbconnectionstring = process.env.HOMITALDB_CONNECTIONSTRING;

if (!dbconnectionstring) {
  console.error(
      new Error('HOMITALDB_CONNECTIONSTRING env var not set'),
  );
  process.exit(1);
}
mongoose.connect(
    dbconnectionstring,
    {useNewUrlParser: true, useUnifiedTopology: true},
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {
  console.log('Connection Successful');
});

/**
 * Get the user using his email
 * @param {string} email
 * @return {DocumentQuery} // import type!
 */
async function getUserByEmail(email) {
  // todo: get all instead of just one and return an error if got more than one
  let theUser;
  await User.findOne({email: email}, (err, user) => {
    if (err) {
      console.log(err);
    }
    console.log('getUserByEmail:', user);
    theUser = user;
  });
  return theUser;
}

/**
 * Get the user using his username
 * @param {string} username
 * @return {DocumentQuery}
 */
async function getUserByUsername(username) {
  // todo: get all instead of just one and return an error if got more than one
  let theUser;
  await User.findOne({username: username}, (err, user) => {
    if (err) {
      console.log(err);
    }
    theUser = user;
  });
  return theUser;
}

/**
 * Register a new user
 * Create a new document in the database
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @return {object} response object
 */
async function registerUser(username, email, password) {
  // also no validation of input format
  const res = await checkExistance(username, email);
  if (res === undefined) {
    // console.log("saving to db...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      email_verified: false,
    });
    await user.save();
    // todo: check for error from user.save()
  }
  return res === undefined ?
    {success: true} :
    {success: false, error: res.toString()};
}

/**
 * Check whether username already exists, or if the email was registered
 * @param {string} username
 * @param {string} email
 * @return {string} error message or undefined if check passed
 */
async function checkExistance(username, email) {
  let errorMessage;
  // the following 2 async functions should run in parallel..
  if (await getUserByUsername(username) !== undefined) {
    // username already exists
    errorMessage = 'username already registered';
  } else if (await getUserByEmail(email) !== undefined) {
    // email already registered
    errorMessage = 'email already registered';
  }
  return errorMessage;
}


/**
 * Save the refresh token as a new document in the database
 * @param {string} token - refresh token
 * @return {number} status (0 for success, anything else for failure)
 */
async function pushRefreshToken(token) {
  const toke = new Token({token: token});
  await toke.save();
  // todo: check for errs
  return 0;
}

/**
 * Check if the provided refresh token is valid
 * (will change callback to something better...)
 * @param {string} token - refresh token
 * @param {Function} callback - emmm
 */
async function checkRefreshToken(token, callback) {
  await Token.findOne({token: token}, (err, tok) => {
    if (err) {
      return callback(err.toString());
    }
    if (tok === null) {
      return callback('refresh token not authorized');
    }
    return callback(null);
  });
}

/**
 * Remove the provided refresh token from database
 * (will change callback to something better...)
 * @param {string} token - refresh token
 * @param {Function} callback - emmm
 */
function removeRefreshToken(token, callback) {
  Token.findOneAndDelete({token: token}, (err, tok) => {
    if (err) {
      return callback(err.toString());
    }
    if (tok === null) {
      return callback('refresh token not authorized');
    }
    return callback(null);
  });
}

module.exports = {
  models: {
    Status: Status,
    User: User,
  },
  functions: {
    getUserByEmail: getUserByEmail,
    getUserByUsername: getUserByUsername,
    registerUser: registerUser,
    pushRefreshToken: pushRefreshToken,
    checkRefreshToken: checkRefreshToken,
    removeRefreshToken: removeRefreshToken,
  },
};
