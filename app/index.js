const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); //load .env file into process.env
var morgan = require('morgan');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 2333;

var accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }));
//app.use(morgan('combined'));

const api_router = require('./routers/api');

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    res.send({header: req.headers, body: req.body});
})

app.get('/', (req, res) => res.send('<h1>Hello from Homital Core~</h1><p>Homital Core currently only serves APIs for apps and devices.</p>'));
//app.use(express.static('../public'));

app.use('/api', api_router);

app.listen(port, () => console.log(`Homital Core listening at port ${port}`));