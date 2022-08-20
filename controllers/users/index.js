// Find correct syntax
// export const get = require('./controller.get');
// export const post = require('./controller.post');
// export const put = require('./controller.put');
// export const del = require('./controller.delete');
module.exports = {
  get: require('./controller.get'),
  post: require('./controller.post'),
  put: require('./controller.put'),
  del: require('./controller.delete'),
};
