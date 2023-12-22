const router = require('express').Router();
const controllers = require('../../../controllers/tribute');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const tributeRouter = router;

tributeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
tributeRouter.route('/:key').post(isValidApiKey, controllers.post.create);
tributeRouter.route('/:key').put(isValidApiKey, controllers.put.update);
tributeRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = tributeRouter;
