//console.log(process.argv);
const express = require('express');
const cors = require('cors');

//const morgan = require('morgan');

const api_router = require('./routers/api');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 2333;

app.use(cors())

app.get('/', (req, res) => res.send('<h1>Hello from Homital Core~</h1><p>Homital Core currently only serves APIs for apps and devices.</p>'));
//app.use(express.static('../public'));

app.use('/api', api_router);

app.listen(port, () => console.log(`Homital Core listening at port ${port}`));