import firebase from 'firebase-admin';
import serviceAccount from '../private/serviceAccountKey.json';

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://size-swap.firebaseio.com/'
});

// let ref = new Firebase('https://size-swap.firebaseio.com/products/');
// ref.on('child_changed',function(childsnapshot,prevchildname){
//   console.log('Change in database');
//   console.log(childsnapshot);
// }) ;