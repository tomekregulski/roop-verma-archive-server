const router = require('express').Router();
const controllers = require('../../../controllers/location');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const locationRouter = router;

locationRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
locationRouter.route('/:key').post(isValidApiKey, controllers.post.create);
locationRouter.route('/:key').put(isValidApiKey, controllers.put.update);
locationRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = locationRouter;
