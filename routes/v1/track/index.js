const router = require('express').Router();
const controllers = require('../../../controllers/track');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const catalogMutation = require('../../../middleware/catalogMutation');
const { noStore, browserGuard } = require('../../../identity/http');

const userRouter = router;

userRouter.route('/:trackId/playback-access/:key')
  .post(noStore, browserGuard, isValidApiKey, require('../../../playback/http'));

userRouter
  .route('/:key')
  .get(isValidApiKey, /* isValidJwt,*/ controllers.get.allTracks);
userRouter
  .route('/:key')
  .post(...catalogMutation, controllers.post.createTrack);
userRouter
  .route('/:key')
  .put(...catalogMutation, controllers.put.update);
userRouter
  .route('/:key')
  .delete(...catalogMutation, controllers.del.delete);
userRouter
  .route('/public/:key')
  .get(isValidApiKey, controllers.get.publicTracks);
userRouter
  .route('/track-play/:key')
  .post(isValidApiKey, controllers.post.trackPlay);

module.exports = userRouter;
