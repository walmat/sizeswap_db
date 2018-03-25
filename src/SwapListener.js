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
  let productId = swapQuery && swapQuery.productID ? swapQuery.productID : undefined;
 // console.log(swapQuery);
  //console.log(productId);
  if(swapQuery && productId) {
    let swaps = await firebase.database().ref('/products/' + productId+ '/swaps/').once("value"); // .orderByChild('in');
    console.log(typeof swaps);
    let swapReturn = swaps.exportVal();
    let foundSwap = false;
    Object.keys(swapReturn).forEach(async(key) =>{
      let current = swapReturn[key];
      if(current.in === swapQuery.out && current.out === swapQuery.in){
        foundSwap = true;
        let requesterSize = current.in;
        let buyerSize = swapQuery.in;
        let requesterId = current.user;
        let buyerId = swapQuery.user;
        let match = {
          requesterSize,
          buyerSize,
          requesterId,
          buyerId
        }
        let result = await firebase.database().ref('/pendingSwaps').push(match);
      }
    });
    if(!foundSwap){
      //Add new swap request to DB
    }
    
    // console.log(swaps.getValue());
    
    

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