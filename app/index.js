const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // load .env file into process.env
const morgan = require('morgan');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.options('*', cors()); // include before other routes

const PORT = process.env.PORT || 2333;

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Homital',
      version: '1.0.0',
    },
  },
  apis: ['./app/index.js', './app/routers/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);
app.get('/swagger.json', (req, res) => {
  res.set('Content-Type', 'application/json').send(swaggerSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '..', 'access.log'), {flags: 'a'},
);
app.use(morgan('combined', {stream: accessLogStream}));
// app.use(morgan('combined'));

const apiRouter = require('./routers/api');

app.use(cors());

app.use(express.json());

/**
 * @openapi
 *
 * /test:
 *   get:
 *     tags:
 *       - miscs
 *     summary: Return request information
 *     produces:
 *       text/json
 *     responses:
 *       '200':
 *         description: Request information
 */
app.get('/test', (req, res) => {
  res.send({header: req.headers, body: req.body});
});

app.get('/',
    (req, res) => res.send(
        `<h1>Hello from Homital Core~</h1>\
<p>Homital Core currently only serves APIs for apps and devices.</p>`,
    ),
);
// app.use(express.static('../public'));

app.use('/api', apiRouter);

app.listen(PORT,
    () => console.log(`Homital Core listening at port ${PORT}`),
);
