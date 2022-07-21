

const { create, Client, decryptMedia, ev, smartUserAgent, NotificationLanguage } = require('@open-wa/wa-automate');
const mime = require('mime-types');
const fs = require('fs');
const wa = require('@open-wa/wa-automate');
const dialogflow = require('@google-cloud/dialogflow');
const mongoose = require('mongoose');
const {fileToBase64} = require('file-base64');
const imageDataURI = require('image-data-uri');
const path = require('path');
const moment = require('moment');

const ON_DEATH = fn => process.on("exit",fn) 

let globalClient
ON_DEATH(async function() {
    console.log('killing session');
    if(globalClient)await globalClient.kill();
  })
  
  /**
   * Detect the qr code
   */
  ev.on('qr.**', async (qrcode,sessionId) => {
    //base64 encoded qr code image
    const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
    fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
  });
  
  /**
   * Detect when a session has been started successfully
   */
  ev.on('STARTUP.**', async (data,sessionId) => {
    if(data==='SUCCESS') console.log(`${sessionId} started!`)
  })
  
  wa.create({
    sessionId: "Chatlearn",
    executablePath: '/usr/bin/chromium-browser',
    multiDevice: true, //required to enable multiDevice support
    authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
  }).then(client => start(client));
  
  async function start(client) {
    async function runSample(projectId, msgNum, messageBody) {
      //const sessionClient = new dialogflow.SessionsClient();
      const sessionClient = new dialogflow.SessionsClient({ keyFilename: path.resolve(__dirname, './utils/sa.json') })
      
      const sessionPath = sessionClient.projectAgentSessionPath(projectId, msgNum);
      // The text query request.
      const request = {
          session: sessionPath,
          queryInput: {
              text: {

                  text: messageBody,
                  languageCode: 'en-US'
              }
          }
      };
      await sessionClient
          .detectIntent(request)
          .then(async(res) => {
              console.log(res)
              let res2 = JSON.parse(JSON.stringify(res));
              //console.log(res2[0])
              //console.log(JSON.stringify(res))
              //console.log(res2);
              //console.log(`fulfilment object: ${res2[0].queryResult.fulfillmentMessages[0]}`);
              try {
                let yh = res2[0].queryResult.webhookPayload
                console.log(JSON.stringify(yh))  
              let resp = yh.fields.google.structValue.fields.richResponse.structValue.fields.items.listValue.values

              //console.log(resp)
              let img 
              let imgTxt 
              let txtResp = resp.map((el)=>{
                if(el.structValue.fields.simpleResponse){
                  return el.structValue.fields.simpleResponse.structValue.fields.textToSpeech.stringValue
                }
                if(el.structValue.fields.basicCard){
                  img = el.structValue.fields.basicCard.structValue.fields.image.structValue.fields.url.stringValue;
                  imgTxt = el.structValue.fields.basicCard.structValue.fields.image.structValue.fields.accessibilityText.stringValue
              }
              });
              
              txtResp.forEach(async (element) => {
                await client.sendText(msgNum, element)
              });
              if(img.length > 0){
                imageDataURI
                        .encodeFromURL(img)
                        .then(async(resp2) => {
                            await client.sendImage(msgNum, resp2, 'filename.jpeg', `*${imgTxt}*\n`)
                            

                        })
                        .catch((err1) => {
                            console.log('failed to send img')
                        })
                
              }
              } catch (error) {
                  //console.log(error)
              }

          })

  }
    client.onMessage(async message => {
      if(message.body === 'Test server'){
        await client.sendText(message.from, '👋 Hello from server!')
      }
      runSample('whatsapp-chatbot-290018', message.from, message.body)
    });
    
    
  }
  