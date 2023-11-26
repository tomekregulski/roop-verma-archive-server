const router = require('express').Router();
const controllers = require('../../../controllers/location');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const locationRouter = router;

locationRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);

module.exports = locationRouter;
