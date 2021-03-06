const functions = require("firebase-functions");
const admin = require('firebase-admin');
let moment = require('moment-timezone');

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const firestore = admin.firestore();

exports.openRestaurants = functions.pubsub.schedule('00,30 * * * *').onRun( async (context) => {
    let momentDate = moment.tz(new Date(), 'Europe/Paris');
    let dayNumber = momentDate.day();
    let dayName;
    switch (dayNumber) {
        case 0:
            dayName = 'sunday';
            break;
        case 1:
            dayName = 'monday';
            break;
        case 2:
            dayName = 'tuesday';
            break;
        case 3:
            dayName = 'wednesday';
            break;
        case 4:
            dayName = 'thursday';
            break;
        case 5:
            dayName = 'friday';
            break;
        case 6:
            dayName = 'saturday';
            break;
        default:
            break;
    }
    try {
        console.log('write batch create');
        let writeBatch = firestore.batch();
        await firestore.collection('list_restaurant').get().then(async (queryRestaurant) => {
            for (let i = 0; i < queryRestaurant.docs.length; i++) {
                
                let restaurant = queryRestaurant.docs[i].data(); 
                let restaurantRef = queryRestaurant.docs[i].ref;
    
                // horaires dans collection horaire
                if ((restaurant.horairesRestaurant == undefined) || (restaurant.horairesRestaurant == null)) {
                    await restaurantRef.collection('horaires').doc(dayName).get().then((horaireQuery) => {
                        let horaireDay = horaireQuery.data();
                        if (horaireDay != null) {
                            let morningStart = horaireDay.morning.open.split(':');
                            let morningEnd = horaireDay.morning.close.split(':');
                            let afternoonStart = horaireDay.afternoon.open.split(':');
                            let afternoonEnd = horaireDay.afternoon.close.split(':');
                        
                            let morningMomentStart = moment.tz(new Date(), 'Europe/Paris').hour(morningStart[0]).minute(morningStart[1]).second(0);
                            let morningMomentEnd = moment.tz(new Date(), 'Europe/Paris').hour(morningEnd[0]).minute(morningEnd[1]).second(0);
                            let afternoonMomentStart = moment.tz(new Date(), 'Europe/Paris').hour( afternoonStart[0]).minute(afternoonStart[1]).second(0);
                            let afternoonMomentEnd = moment.tz(new Date(), 'Europe/Paris').hour(afternoonEnd[0]).minute(afternoonEnd[1]).second(0);
                        
                            let morningStartCondition = (momentDate.isAfter(morningMomentStart));
                            let morningEndCondition = (momentDate.isAfter(morningMomentEnd));
                            let morningOpenCondition = (morningStartCondition && !morningEndCondition);
                        
                            let afternoonStartCondition = (momentDate.isAfter(afternoonMomentStart));
                            let afternoonEndCondition = (momentDate.isAfter(afternoonMomentEnd));
                            let afternoonOpenCondition = (afternoonStartCondition && !afternoonEndCondition);
                        
                            if (morningOpenCondition || afternoonOpenCondition) {
                                if (!restaurant.ouvert) {
                                    console.log(`update: ${restaurant.nom} ferm?? ->  ouvert`);
                                    console.log(`date: ${momentDate}`);
                                    writeBatch.update(restaurantRef, {'ouvert': true});
                                    console.log('write batch update');
                                }
                            } else {
                                if (restaurant.ouvert) {
                                    console.log(`update: ${restaurant.nom} ouvert ->  ferm??`);
                                    console.log(`date: ${momentDate}`);
                                    writeBatch.update(restaurantRef, {'ouvert': false});
                                    console.log('write batch update');
                                }
                            }
                        }
                    });
                
                // horaire dans objet restaurant
                } else if ((restaurant.horairesRestaurant != undefined) || (restaurant.horairesRestaurant != null)) {
                    if ((restaurant.horairesRestaurant[dayName] != undefined) || (restaurant.horairesRestaurant[dayName] != null)) {
                        let horaireDay = restaurant.horairesRestaurant[dayName];
                        let morningStart = horaireDay.morning.open.split(':');
                        let morningEnd = horaireDay.morning.close.split(':');
                        let afternoonStart = horaireDay.afternoon.open.split(':');
                        let afternoonEnd = horaireDay.afternoon.close.split(':');
                    
                        let morningMomentStart = moment.tz(new Date(), 'Europe/Paris').hour(morningStart[0]).minute(morningStart[1]).second(0);
                        let morningMomentEnd = moment.tz(new Date(), 'Europe/Paris').hour(morningEnd[0]).minute(morningEnd[1]).second(0);
                        let afternoonMomentStart = moment.tz(new Date(), 'Europe/Paris').hour( afternoonStart[0]).minute(afternoonStart[1]).second(0);
                        let afternoonMomentEnd = moment.tz(new Date(), 'Europe/Paris').hour(afternoonEnd[0]).minute(afternoonEnd[1]).second(0);
                    
                        let morningStartCondition = (momentDate.isAfter(morningMomentStart));
                        let morningEndCondition = (momentDate.isAfter(morningMomentEnd));
                        let morningOpenCondition = (morningStartCondition && !morningEndCondition);
                    
                        let afternoonStartCondition = (momentDate.isAfter(afternoonMomentStart));
                        let afternoonEndCondition = (momentDate.isAfter(afternoonMomentEnd));
                        let afternoonOpenCondition = (afternoonStartCondition && !afternoonEndCondition);
                    
                        if (morningOpenCondition || afternoonOpenCondition) {
                            if (!restaurant.ouvert) {
                                console.log(`update: ${restaurant.nom} ferm?? ->  ouvert`);
                                console.log(`date: ${momentDate}`);
                                writeBatch.update(restaurantRef, {'ouvert': true});
                                console.log('write batch update');
                            }
                        } else {
                            if (restaurant.ouvert) {
                                console.log(`update: ${restaurant.nom} ouvert ->  ferm??`);
                                console.log(`date: ${momentDate}`);
                                writeBatch.update(restaurantRef, {'ouvert': false});
                                console.log('write batch update');
                            }
                        }
                    }
                }
            }
        });
        console.log('write batch commit');
        await writeBatch.commit()
        return 'succes';
    } catch (error) {
        console.log(error);
        throw error;
    }
})