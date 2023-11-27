const router = require('express').Router();
const controllers = require('../../../controllers/artist');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const artistRouter = router;

artistRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);

module.exports = artistRouter;
