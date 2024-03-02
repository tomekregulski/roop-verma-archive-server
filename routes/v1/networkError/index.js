const router = require('express').Router();
const controllers = require('../../../controllers/networkError');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const networkErrorRouter = router;

networkErrorRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
networkErrorRouter.route('/:key').post(isValidApiKey, controllers.post.create);
networkErrorRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = networkErrorRouter;
