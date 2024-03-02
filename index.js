const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./handlers/error');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cookieParser());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/v1', require('./routes/v1/index'));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}!`);
});
