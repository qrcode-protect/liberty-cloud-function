const functions = require("firebase-functions");
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const firestore = admin.firestore();


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

exports.onCommandeUpdated = functions.firestore.document('commandes_restauration/{commandeId}').onUpdate( async (change, context) => {
    const commandeData = change.after.data();
    const commandeDataBefore = change.before.data();
    let payloadList = [];
    let targetList = [];

    // generate payload for notif
    if ((commandeDataBefore.restaurantStatus.annule == false) && // resto annule la commande
        (commandeData.restaurantStatus.annule == true)) {
        console.log('commande annulée par le resto : (annulé false -> true)'); 
        payloadList.push({
            token: commandeData.client.token,
            notification: {
                title: 'Commande annulée',
                body: `La commande #${commandeData.id.substring(0,5)}, à été annulée par le restaurateur.`,
            },
        });
        targetList.push('utilisateurs');
    } else if ((commandeDataBefore.restaurantStatus.encours === false) && // resto accepte la commande
     (commandeData.restaurantStatus.encours === true)) {
        console.log('resto accepte commande (en cours : false -> true) ');
        payloadList.push({
            token: commandeData.client.token,
            notification: {
                title: 'Commande acceptée !',
                body: `La commande #${commandeData.id.substring(0,5)}, à été acceptée par le restaurateur.`,
            },
        });
        targetList.push('utilisateurs');
        if ((commandeData.livreur != null)) { // livreur recoit une nouvelle commande
            console.log('nouvelle commande livreur');
            payloadList.push({
                token: commandeData.livreur.token,
                notification: {
                    title: 'Nouvelle commande !',
                    body: `Vous avez recu une nouvelle commande !.`,
                },
            });
            targetList.push('prestataires_livraison');
        }
    } else if ((commandeDataBefore.restaurantStatus.termine === false) && //resto termine commande
    (commandeData.restaurantStatus.termine === true)) {
        if ((commandeData.livreur === null) || (commandeData.livreur === undefined)) { //sans livraison
            console.log('resto fini commande : pas de livraison client doit aller chercher (termine : false -> true && livreur null)');
            payloadList.push({
                token: commandeData.client.token,
                notification: {
                    title: 'Commande prête !',
                    body: `Votre commande est prête ! Venez vite la récuperer au comptoir.`,
                },
            });
            targetList.push('utilisateurs');
        } else { // avec livraison
            console.log('resto fini commande : notif à envoyer au livreur (termine : false -> true && livreur ok)');
            payloadList.push({
                token: commandeData.livreur.token,
                notification: {
                    title: 'Commande prête',
                    body: `La commande #${commandeData.id.substring(0,5)}, est prête pour être prise en charge.`,
                },
            });
            targetList.push('prestataires_livraison')
        }
    } else if ((commandeDataBefore.colisRecup === false) && (commandeData.colisRecup === true)) { //livreur à recup le colis
        console.log('livreur à recup la commande : (colis recup : false -> true)');
        payloadList.push({
            token: commandeData.client.token,
            notification: {
                title: 'Commande prise en charge',
                body: `Votre commande à été prise en charge par le livreur.`,
            },
        });
        targetList.push('utilisateurs')
        
    } else if (((commandeDataBefore.estArrive === false) 
        || (commandeDataBefore.estArrive === null)
        || (commandeDataBefore.estArrive === undefined)) 
        && (commandeData.estArrive === true) && (commandeData.livreur != null)) { // livreur arrivé à coté du client
        console.log('livreur arrivé au domicile : (estArrive : false -> true)');
        payloadList.push({
            token: commandeData.client.token,
            notification: {
                title: 'Commande arrivée !',
                body: `Votre livreur est devant la porte !.`,
            },
        });
        targetList.push('utilisateurs');
    }

    // send notif && save document on user doc
    for (let i = 0; i < payloadList.length; i++) {
        const payload = payloadList[i];
        const target = targetList[i];
        await admin.messaging().send(payload).then(async (resp) => { 
            payload.notification.lu = false;
            payload.notification.date = new Date().toISOString();
            payload.notification.client = commandeData.client;
            await firestore.collection(`${target}/${commandeData.client.id}/notifications_messages`).add(payload.notification).then(async (result) => {
                console.log(`Document created at ${result.path} at ${new Date().toLocaleTimeString()}`);
                await firestore.doc(result.path).update({id: result.id}).then(async (result) => {
                    console.log(`Document updated at ${new Date().toLocaleTimeString()}`);                    
                }).catch((err) => {
                    throw err;
                });
            }).catch((err) => {
                throw err;
            });
        }).catch((err) => {
            throw err;
        });
    }
})