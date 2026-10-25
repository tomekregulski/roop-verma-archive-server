const router = require('express').Router();
const controllers = require('../../../controllers/event');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const eventRouter = router;

eventRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
eventRouter.route('/:key').post(...catalogMutation, controllers.post.create);
eventRouter.route('/:key').put(...catalogMutation, controllers.put.update);
eventRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = eventRouter;
