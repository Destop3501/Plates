const authService = require('./auth');
const friendsService = require('./friends');
const billingService = require('./billing');
const restaurantsService = require('./restaurants');

module.exports = {
  ...authService,
  ...friendsService,
  ...billingService,
  ...restaurantsService
};
