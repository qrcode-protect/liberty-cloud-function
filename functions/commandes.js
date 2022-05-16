const functions = require("firebase-functions");
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const firestore = admin.firestore();

exports.assignCommand = functions.https.onCall(async (data, context) => {
    try {
        console.log('here');
        let commande = data.commande;
        let listLivreurs;
        let livreur = null; 
        
        for (let nb = 0; nb <= 5; nb++) {
            await firestore.collection('prestataires_livraison').where('actif', '==', true).where('nbCommandes', '==', nb).get().then((livreursData) => {
                console.log(`length: ${livreursData.docs.length} at ${nb}`);
                listLivreurs = livreursData.docs;
                if (listLivreurs.length > 0) {
                    const min = 0;
                    const max = listLivreurs.length;
                    const randomIndex = Math.floor(Math.random() * (max));
                    livreur = listLivreurs[randomIndex].data();
                }
            })
            if (livreur) {
                break;
            }
        }
        if (livreur) {
            console.log(livreur);
            commande.livreur = livreur;
            await firestore.collection('commandes_restauration').add(commande).then( async (value) => {
                await firestore.collection('commandes_restauration').doc(value.id).update({'id': value.id});
            });
            return {'result': 'success'};
        } else {

            //TODO : fix & changer collection à poster si commande n'a pas pu aboutir (commandes_restauration_annule)
            await firestore.collection('commandes_restauration_annule').add(commande).then( async (value) => {
                await firestore.collection('commandes_restauration_annule').doc(value.id).update(
                    {
                        'id': value.id, 
                        'livraisonStatus': {
                            'annule': true,
                            'demande': false,
                            'encours': false,
                            'termine': false,
                        },
                        'restaurantStatus': {
                            'annule': true,
                            'demande': false,
                            'encours': false,
                            'termine': false,
                    }
                });
            });
            
            console.log(`client token : ${commande.client.token}`);
            if (commande.client.token) {
                const payload = {
                    token: commande.client.token,
                    notification: {
                        title: 'Commande annulée !',
                        body: 'Aucun livreur n\'a été trouvé, la commande est annulée.',
                    },
                }
    
                admin.messaging().send(payload).then(async (response)  =>  {
                    payload.notification.lu = false;
                    payload.notification.date = new Date().toISOString();
                    payload.notification.client = commandeData.client;
                    console.log('Notif envoyée.', response);
                    await firestore.collection(`utilisateurs/${commandeData.prestataire.id}/messages`).add(payload);
                })
            } else {
                console.log('Client n\'a pas de token.');
            }
            
            return {'result': 'Pas de livreur trouvé'};
        }
        
        
        
    } catch (error) {
        console.log(error);
    }
});