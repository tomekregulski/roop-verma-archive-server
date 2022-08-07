const router = require('express').Router();
const controllers = require('../../../controllers/tracks');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const isValidJwt = require('../../../middleware/isValidJwt');
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const userRouter = router;

userRouter.route('/:key').get(isValidApiKey, controllers.get.allTracks);
userRouter
  .route('/public/:key')
  .get(isValidApiKey, controllers.get.publicTracks);
userRouter
  .route('/track-plays/:key')
  .post(isValidApiKey, controllers.post.trackPlay);

module.exports = userRouter;
