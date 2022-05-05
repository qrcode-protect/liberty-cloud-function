const functions = require("firebase-functions");
const admin = require('firebase-admin');
const uuid = require('uuid');


exports.createUser = functions.https.onCall(async (data, context) => {
    try {
        if (context.auth) {
            const categorie = data.categorie;
            const userInfo = JSON.parse(JSON.stringify(data.userInfo));
            const db = admin.firestore();
            const password = uuid.v4().replace('-', '').substring(0,9);
            const displayName = userInfo.prenom + '.' + userInfo.nom[0];

            let collectionName = '';
            switch (categorie) {
                case 'Beauté':
                    collectionName = 'prestataires_beaute';
                    break;
                case ('Livraison' || 'Livraison - Restauration'):
                    collectionName = 'prestataires_livraison';
                    break;
                default:
                    throw 'Categorie pas correcte.'
            }

            return admin.auth().createUser({
                email: userInfo.mail,
                emailVerified: true,
                displayName: displayName,
                avatar: userInfo.photo,
                password: password,
                disabled: false,
            }).then(async (userRecord) => {
                const user = {
                    'id': userRecord.uid, 
                    'actif': false, 
                    'disponible': true, 
                    'nom': displayName, 
                    'email': userRecord.email, 
                    'phone': userInfo.numero, 
                    'token': '', 
                    'avatar': userRecord.avatar ?? '',
                };
                await db.collection(collectionName).doc(userRecord.uid).create(user);

                return {'user': user, 'password': password};
            })
        }
    } catch (error) {
        throw error;
    }
})