const cron = require('./cron');
const listener = require('./listener');
const adminFunctions = require('./admin');
const mail = require('./mail');
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.sendMailGmail = mail.sendMailGmail;
exports.sendMailUserCreated = mail.sendMailUserCreated;

exports.createUser = adminFunctions.createUser;

exports.openRestaurants = cron.openRestaurants;

exports.onUserBeauteStatusChanged = listener.onUserBeauteStatusChanged; // gestion presence
exports.onUserLivraisonStatusChanged = listener.onUserLivraisonStatusChanged; // gestion presence
exports.onCommandeReceivedBeaute = listener.onCommandeReceivedBeaute; 
exports.onCommandeUpdated = listener.onCommandeUpdated; // gestion notif lors de l'update d'une commande