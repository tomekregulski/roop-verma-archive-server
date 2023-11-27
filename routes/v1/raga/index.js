const router = require('express').Router();
const controllers = require('../../../controllers/raga');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const ragaRouter = router;

ragaRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);

module.exports = ragaRouter;
