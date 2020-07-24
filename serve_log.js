const fs = require('fs');
const http = require('http');

http.createServer(function(req, res) {
  fs.readFile(__dirname + '/access.log', function(err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(8765);
