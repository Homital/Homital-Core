const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // load .env file into process.env
const morgan = require('morgan');

const app = express();
app.options('*', cors()); // include before other routes
const port = process.argv.length > 2 ? process.argv[2] : 2333;

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '..', 'access.log'), {flags: 'a'},
);
app.use(morgan('combined', {stream: accessLogStream}));
// app.use(morgan('combined'));

const apiRouter = require('./routers/api');

app.use(cors());


app.use(express.json());

app.get('/test', (req, res) => {
  res.send({header: req.headers, body: req.body});
});

app.get('/',
    (req, res) => res.send(
        `<h1>Hello from Homital Core~</h1>
        <p>Homital Core currently only serves APIs for apps and devices.</p>`,
    ),
);
// app.use(express.static('../public'));

app.use('/api', apiRouter);

if (process.argv.includes('dev')) {
  app.listen(port,
      () => console.log(`Homital Core (dev) listening at port ${port}`),
  );
} else {
  https.createServer({
    key: fs.readFileSync(process.env.HTTPS_KEY),
    cert: fs.readFileSync(process.env.HTTPS_SECRET),
  }, app)
      .listen(port, () => console.log(`
          Homital Core listening at port ${port} over HTTPS
      `));
}
