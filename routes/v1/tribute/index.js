const router = require('express').Router();
const controllers = require('../../../controllers/tribute');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const tributeRouter = router;

tributeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
tributeRouter.route('/:key').post(...catalogMutation, controllers.post.create);
tributeRouter.route('/:key').put(...catalogMutation, controllers.put.update);
tributeRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = tributeRouter;
