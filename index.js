const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const sequelize = require('./config/config');
// const models = require('./models');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./handlers/error');
// const http = require('http');

const routes = require('./controllers');
const PORT = process.env.PORT || 8080;

const app = express();

// const ws = require('ws');

app.use(cookieParser());

// var corsOptions = {
//   origin: '/',
// };

// app.use(cors(corsOptions));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/v1', require('./routes/v1/index'));
app.use(routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}!`);
});
// const httpServer = app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}!`);
// });

// const wsServer = new ws.Server({ noServer: true });

// wsServer.emit('connection', ws);

// // httpServer.on('upgrade', (req, socket, head) => {
// //   wsServer.handleUpgrade(req, socket, head, (ws) => {
// //     wsServer.emit('connection', ws, req);
// //   });
// // });

// wsServer.on('connection', (ws) => {
//   //connection is up, let's add a simple simple event
//   ws.on('message', (message) => {
//     //log the received message and send it back to the client
//     console.log('received: %s', message);
//     ws.send(`Hello, you sent -> ${message}`);
//   });

//   //send immediatly a feedback to the incoming connection
//   ws.send('Hi there, I am a WebSocket server');
// });
