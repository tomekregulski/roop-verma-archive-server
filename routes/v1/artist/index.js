const router = require('express').Router();
const controllers = require('../../../controllers/artist');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');

const artistRouter = router;

artistRouter.route('/:key').get(isValidApiKey, controllers.get.getAll);
artistRouter.route('/:key').post(...catalogMutation, controllers.post.create);
artistRouter.route('/:key').put(...catalogMutation, controllers.put.update);
artistRouter.route('/:key').delete(...catalogMutation, controllers.del.delete);

module.exports = artistRouter;
