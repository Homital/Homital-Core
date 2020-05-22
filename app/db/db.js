var mongoose = require('mongoose');
var Status = require('./models/status');

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



module.exports = {
    models: {
        Status: Status
    }
}