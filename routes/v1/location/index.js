const router = require('express').Router();
const controllers = require('../../../controllers/location');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const locationRouter = router;

locationRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
locationRouter.route('/:key').post(...catalogMutation, controllers.post.create);
locationRouter.route('/:key').put(...catalogMutation, controllers.put.update);
locationRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = locationRouter;
