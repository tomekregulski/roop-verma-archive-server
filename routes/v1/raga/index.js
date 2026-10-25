const router = require('express').Router();
const controllers = require('../../../controllers/raga');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const ragaRouter = router;

ragaRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
ragaRouter.route('/:key').post(...catalogMutation, controllers.post.create);
ragaRouter.route('/:key').put(...catalogMutation, controllers.put.update);
ragaRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = ragaRouter;
