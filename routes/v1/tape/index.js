const router = require('express').Router();
const controllers = require('../../../controllers/tape');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const tapeRouter = router;

tapeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);

module.exports = tapeRouter;
