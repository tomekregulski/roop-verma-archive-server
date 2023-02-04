const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const sequelize = require('./config/config');
// const models = require('./models');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./handlers/error');
const { Artist } = require('./models');

const routes = require('./controllers');
const PORT = process.env.PORT || 5000;

const app = express();

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
