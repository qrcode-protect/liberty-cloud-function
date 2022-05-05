const functions = require("firebase-functions");
const admin = require('firebase-admin');


exports.onUserBeauteStatusChanged = functions.database.ref('/status/beaute/{uid}').onUpdate(
    async (change, context) => {
        const eventStatus = change.after.val();

        const userStatusFirestoreRef = firestore.doc(`prestataires_beaute/${context.params.uid}`);

        const statusSnapshot = await change.after.ref.once('value');
        const status = statusSnapshot.val();
        functions.logger.log(status, eventStatus);

        if (status.last_changed > eventStatus.last_changed) {
            return null;
        }

        eventStatus.last_changed = new Date(eventStatus.last_changed);

        if (eventStatus.state == false) {
            userStatusFirestoreRef.update({'actif': eventStatus.state})
        }

        return userStatusFirestoreRef.update({'connected': eventStatus.state});
    });

exports.onUserLivraisonStatusChanged = functions.database.ref('/status/livraison/{uid}').onUpdate(
    async (change, context) => {
        const eventStatus = change.after.val();

        const userStatusFirestoreRef = firestore.doc(`prestataires_livraison/${context.params.uid}`);

        const statusSnapshot = await change.after.ref.once('value');
        const status = statusSnapshot.val();
        functions.logger.log(status, eventStatus);

        if (status.last_changed > eventStatus.last_changed) {
            return null;
        }

        eventStatus.last_changed = new Date(eventStatus.last_changed);

        if (eventStatus.state == false) {
            userStatusFirestoreRef.update({'actif': eventStatus.state})
        }

        return userStatusFirestoreRef.update({'connected': eventStatus.state});
});
    
exports.onCommandeReceivedBeaute = functions.firestore.document('commandes_beaute/{commandeId}').onCreate( 
    async (snap, context) => {
    
    const commandeData = snap.data();

    const payload = {
        token: commandeData.prestataire.token,
        notification: {
        title: 'Nouvelle commande !',
        body: 'Vous avez recu une nouvelle commande.',
        },
    }

    admin.messaging().send(payload).then(async (response)  =>  {
        console.log('Notif envoyée.', response);
        
        await firestore.collection(`prestataires_beaute/${commandeData.prestataire.id}/messages`).add(payload).then((result) => {
            return {success: true};
        }).catch((error) => {
            return {error: error};
        });
    }).catch((error) => {
        return {error: error};
    })

})

exports.onCommandeReceivedLivraison = functions.firestore.document('commandes_restauration/{commandeId}').onUpdate( 
    async (change, context) => {
    
    const commandeData = change.after.data();
    const commandeDataBefore = change.before.data();
    if (commandeDataBefore.restaurantStatus.encours == false) {
        if (commandeData.livreur != null && commandeData.restaurantStatus.encours) {  
        const payload = {
            token: commandeData.livreur.token,
            notification: {
            title: 'Nouvelle commande !',
            body: 'Vous avez recu une nouvelle commande.',
            },
        }
    
        admin.messaging().send(payload).then(async (response)  =>  {
            await firestore.collection(`prestataires_livraison/${commandeData.prestataire.id}/messages`).add(payload).then((result) => {
                return {success: true};
            }).catch((error) => {
                return {error: error};
            });
        }).catch((error) => {
            return {error: error};
        })
        }
    }
})

exports.onCommandeCanceledRestauration = functions.firestore.document('commandes_restauration/{commandeId}').onUpdate( 
    async (change, context) => {
    
    const commandeData = change.after.data();
    const commandeDataBefore = change.before.data();
    if (commandeDataBefore.restaurantStatus.annule == false) {
        if (commandeData.restaurantStatus.annule == true) {  
        const payload = {
            token: commandeData.client.token,
            notification: {
            title: 'Commande annulée',
            body: `La commande #${commandeData.id}, à été annulée par le restaurateur.`,
            },
        }
    
        return admin.messaging().send(payload).then(async (response)  =>  {
            console.log(`Notif sent to ${commandeData.client.token} (client: ${commandeData.client.id})`);
            payload.notification.lu = false;
            payload.notification.date = new Date().toISOString();
            payload.notification.client = commandeData.client;
            firestore.collection(`utilisateurs/${commandeData.client.id}/notifications_messages`).add(payload.notification).then( async (result) => {
            console.log(`Document created at ${result.path} at ${new Date().toLocaleTimeString()}`);
            firestore.doc(result.path).update({id: result.id}).then(async (result) => {
                    console.log(`Document updated at ${new Date().toLocaleTimeString()}`);
                    return {success: true};
                }).catch((error) => {
                    console.log(error);
                    throw {error: error};
                })
            }).catch((error) => {
                console.log(error);
                throw {error: error};
            });
        }).catch((error) => {
            console.log(error);
            throw {error: error};
        })
        }
    }
})