const router = require('express').Router();
const controllers = require('../../../controllers/mediaType');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const mediaTypeRouter = router;

mediaTypeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
mediaTypeRouter.route('/:key').post(isValidApiKey, controllers.post.create);
mediaTypeRouter.route('/:key').put(isValidApiKey, controllers.put.update);
mediaTypeRouter.route('/:key').delete(isValidApiKey, controllers.del.delete);

module.exports = mediaTypeRouter;
