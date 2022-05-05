const cron = require('./cron');
const listener = require('./listener');
const adminFunctions = require('./admin');
const mail = require('./mail');

const admin = require('firebase-admin');
admin.initializeApp();


exports.sendMailGmail = mail.sendMailGmail;
exports.sendMailUserCreated = mail.sendMailUserCreated;

exports.createUser = adminFunctions.createUser;

exports.openRestaurants = cron.openRestaurants;

exports.onUserBeauteStatusChanged = listener.onUserBeauteStatusChanged;
exports.onUserLivraisonStatusChanged = listener.onUserLivraisonStatusChanged;
exports.onCommandeReceivedBeaute = listener.onCommandeReceivedBeaute;
exports.onCommandeReceivedLivraison = listener.onCommandeReceivedLivraison;
exports.onCommandeCanceledRestauration = listener.onCommandeCanceledRestauration;