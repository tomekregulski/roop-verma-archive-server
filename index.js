const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sequelize = require('./config/connection');
// const cors = require('cors');

const routes = require('./controllers');
const PORT = process.env.PORT || 5000;

const app = express();

// var corsOptions = {
//   origin: '/',
// };

// app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
  });
});
