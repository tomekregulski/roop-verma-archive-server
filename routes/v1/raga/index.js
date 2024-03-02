const router = require('express').Router();
const controllers = require('../../../controllers/raga');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const ragaRouter = router;

ragaRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
ragaRouter.route('/:key').post(isValidApiKey, controllers.post.create);
ragaRouter.route('/:key').put(isValidApiKey, controllers.put.update);
ragaRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = ragaRouter;
