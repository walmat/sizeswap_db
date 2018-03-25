"use strict";
import firebase from 'firebase-admin';
import serviceAccount from '../private/serviceAccountKey.json';
import emailAccountInfo from '../private/emailAccountInfo.json';
import server from 'node-http-server';
import nodemailer from 'nodemailer';

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
  let productId = swapQuery && swapQuery.productID ? swapQuery.productID : undefined;2
 // console.log(swapQuery);
  //console.log(productId);
  let foundSwap = false;
  if(swapQuery && productId) {
    let swaps = await firebase.database().ref('/products/' + productId+ '/swaps/').orderByChild('time').once("value"); // .orderByChild('in');
    let swapReturn = swaps.exportVal();
    if(swapReturn) {
      Object.keys(swapReturn).forEach(async(key) =>{
        let current = swapReturn[key];
        if(!foundSwap && current.in === swapQuery.out && current.out === swapQuery.in){
          foundSwap = true;
          let requesterSize = current.in;
          let buyerSize = swapQuery.in;
          let requesterId = current.user;
          let buyerId = swapQuery.user;
          let match = {
            productTitle: swapQuery.productTitle,
            requesterSize,
            buyerSize,
            requesterId,
            buyerId,
            time: Date.now(),
            user1Name: swapQuery.user.name,
            user1Address: swapQuery.user.address,
            user2Name: current.userName,
            user2Address: current.userAddress
          }
          let result = await firebase.database().ref('/pendingSwaps').push(match);
  
          firebase.database().ref('/products/' + productId + '/swaps/' + key).remove();
          sendEmail(current);
        }
      });
    }
    if(!foundSwap){
      //Add new swap request to DB
      firebase.database().ref('/products/' + productId + '/swaps/').push({
        productTitle: swapQuery.productTitle,
        user: swapQuery.user.ID,
        userName: swapQuery.user.name,
        userAddress: swapQuery.user.address,
        in: swapQuery.in,
        out: swapQuery.out,
        time: Date.now()
      });
    }
  }
  serve(
    request,
    response,
    JSON.stringify({
    statusCode: 200
  }));
}

async function sendEmail(current) {
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      auth: {
        type: 'OAuth2',
        user: emailAccountInfo.email,
        clientId: emailAccountInfo.clientId,
        clientSecret: emailAccountInfo.clientSecret,
        refreshToken: emailAccountInfo.refreshToken
      }
  });

    let userTuple = await firebase.database().ref('/user/' + current.user).once("value"); // .orderByChild('in');
    let userReturn = userTuple.exportVal();
    let userProfile = {};
    if(userReturn) {
      userProfile = {
        emailTo: userReturn.email,
        userFullName: userReturn.name
      }
    }

  // setup email data with unicode symbols
  let text = `Hello ` + userProfile.userFullName + '\n \n We have found someone who is looking to swap with you! Head to the orders tab on your profile to confirm you are still willing to trade. Cancelling the trade will result in a fee.';
  let mailOptions = {
      from: '"Size Swap Customer Service 👻" emailAccountInfo.email', // sender address
      to: userProfile.emailTo,
      subject: 'We Found A Swap For You 💯', // Subject line

      html: `<b>${text}</b>` // html body
  };

  console.log('HELP');

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  });
}