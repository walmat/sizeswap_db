"use strict";
import firebase from 'firebase-admin';
import serviceAccount from '../private/serviceAccountKey.json';
import server from 'node-http-server';

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://size-swap.firebaseio.com/'
});
const config = new server.Config;
 
config.port=3000;
config.verbose=true;
 
server.onRequest=handleSwaps;
 
server.deploy(config);

async function handleSwaps(request,response,serve) {
  console.log('hit');
  let swapQuery = request.body ? JSON.parse(request.body) : undefined;
  let productId = swapQuery && swapQuery.productId ? swapQuery.productId : undefined;
  
  if(swapQuery && productId) {
    let swaps = await firebase.list('/products/' + id + '/swaps/');
    console.log(swaps);
  }
  return JSON.stringify({
    statusCode: 200
  });
}


// firebase.database().ref().child('/products/:key/swaps').on('child_added',function(snapshot){
//     console.log('child added');
// });
// let ref = new Firebase('https://size-swap.firebaseio.com/products/');
// ref.on('child_changed',function(childsnapshot,prevchildname){
//   console.log('Change in database');
//   console.log(childsnapshot);
// }) ;