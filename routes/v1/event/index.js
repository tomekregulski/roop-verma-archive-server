const router = require('express').Router();
const controllers = require('../../../controllers/event');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const eventRouter = router;

eventRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
eventRouter.route('/:key').post(isValidApiKey, controllers.post.create);
eventRouter.route('/:key').put(isValidApiKey, controllers.put.update);
eventRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = eventRouter;
