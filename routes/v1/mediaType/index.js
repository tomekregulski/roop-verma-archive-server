const router = require('express').Router();
const controllers = require('../../../controllers/mediaType');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const mediaTypeRouter = router;

mediaTypeRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
mediaTypeRouter.route('/:key').post(...catalogMutation, controllers.post.create);
mediaTypeRouter.route('/:key').put(...catalogMutation, controllers.put.update);
mediaTypeRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = mediaTypeRouter;
