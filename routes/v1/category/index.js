const router = require('express').Router();
const controllers = require('../../../controllers/artist');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const artistRouter = router;

artistRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
artistRouter.route('/:key').post(isValidApiKey, controllers.post.create);
artistRouter.route('/:key').put(isValidApiKey, controllers.put.update);
artistRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = artistRouter;
