const router = require('express').Router();
const controllers = require('../../../controllers/track');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter
  .route('/:key')
  .get(isValidApiKey, /* isValidJwt,*/ controllers.get.allTracks);
userRouter
  .route('/:key')
  .post(isValidApiKey, /* isValidJwt,*/ controllers.post.createTrack);
userRouter
  .route('/:key')
  .put(isValidApiKey, /* isValidJwt,*/ controllers.put.update);
userRouter
  .route('/:key')
  .delete(isValidApiKey, /* isValidJwt,*/ controllers.del.delete);
userRouter
  .route('/public/:key')
  .get(isValidApiKey, controllers.get.publicTracks);
userRouter
  .route('/track-play/:key')
  .post(isValidApiKey, controllers.post.trackPlay);

module.exports = userRouter;
