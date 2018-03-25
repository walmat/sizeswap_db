"use strict";
import firebase from 'firebase-admin';
import server from 'node-http-server';
import serviceAccount from '../private/serviceAccountKey.json';


firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://size-swap.firebaseio.com/'
});
const config = new server.Config;
 
config.port=3002;
config.verbose=true;
 
server.onRequest=handleSwapConfirmations;
 
server.deploy(config);

async function handleSwapConfirmations(request,response,serve) {
    let swapInfo = request.body ? JSON.parse(request.body) : undefined;

    let pendingSwap = (await firebase.database().ref('/pendingSwaps/' + swapInfo.pendingSwapKey).once("value")).exportVal(); 

    if(swapInfo.confirmation){
        let match = {
            Address1: pendingSwap.user1Address,
            userName1: pendingSwap.user1Name,
            userSize1: pendingSwap.buyerSize,
            userAddress2: pendingSwap.user2Address,
            userName2: pendingSwap.user2Name,
            userSize2: pendingSwap.requesterSize,
            userId1: pendingSwap.buyerId,
            userId2: pendingSwap.requesterId,
            productTitle: pendingSwap.productTitle,
            time: Date.now()
          }
          let result = await firebase.database().ref('/shippingSwaps').push(match);
  
          
    }
    else{
        let newSwap = {
            in: pendingSwap.buyerSize,
            out: pendingSwap.requesterSize,
            time: Date.now(),
            user: pendingSwap.buyerId,
        }
        //let product = (await firebase.database().ref('/product/' + swapInfo.pendingSwapKey).once("value")).exportVal()
        let result = (await firebase.database().ref('/products').orderByChild('title').equalTo(pendingSwap.productTitle).once("value")).exportVal();
        console.log(newSwap);
        let insertion = firebase.database().ref('/products/' + Object.keys(result)[0] + '/swaps').push(newSwap);
    }
    firebase.database().ref('/pendingSwaps/' + swapInfo.pendingSwapKey).remove();
}