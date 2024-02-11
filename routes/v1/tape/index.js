const router = require('express').Router();
const controllers = require('../../../controllers/tape');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const tapeRouter = router;

tapeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
tapeRouter.route('/:key').post(isValidApiKey, controllers.post.create);
tapeRouter.route('/:key').put(isValidApiKey, controllers.put.update);
tapeRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = tapeRouter;
