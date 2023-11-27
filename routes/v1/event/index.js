const router = require('express').Router();
const controllers = require('../../../controllers/event');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const eventRouter = router;

eventRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);

module.exports = eventRouter;
