const router = require('express').Router();
const controllers = require('../../../controllers/tape');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const tapeRouter = router;

tapeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
tapeRouter.route('/:key').post(...catalogMutation, controllers.post.create);
tapeRouter.route('/:key').put(...catalogMutation, controllers.put.update);
tapeRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = tapeRouter;
