const OracleBot = require('@oracle/bots-node-sdk');
const TelegramBot = require('node-telegram-bot-api');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;

module.exports = (app) => {
  const logger = console;
  // initialize the application with OracleBot
  OracleBot.init(app, {
    logger,
  });

  // Telegram bot - webhook config
  const telegramToken = process.env.TELEGRAM_API_KEY;
  const telegramURL = 'YOUR_TELEGRAM_WEBHOOK_URL';
  const bot = new TelegramBot(telegramToken);
  //bot.setWebHook( telegramURL );
  // variable to store chatId
  var chatId;
  
  // add webhook integration
  const webhook = new WebhookClient({
    channel: {
        url: process.env.BOT_WEBHOOK_URL,
        secret: process.env.BOT_WEBHOOK_SECRET
    }
  });
  const MessageModel = webhook.MessageModel();
  // Add webhook event handlers
  webhook.on(WebhookEvent.MESSAGE_RECEIVED, message => {
    logger.info("Message from bot:", message);

    // send to client...

    var cards = [];
    var keyboard = [];
    var keyboard3 = [];
    var idx = 0;

    if (Array.isArray(message.messagePayload.actions)) {
      for (var i = 0; i < message.messagePayload.actions.length; i++) {
        logger.info("Button 1-" + message.messagePayload.actions[i].label);
        // keyboard

        keyboard3.push({ text: message.messagePayload.actions[i].label });
        
        idx++;
       
        if (idx == 3) {
          idx = 0;
          keyboard.push(keyboard3);
          keyboard3 = [];
        }

        if(i == 9){
          keyboard3.push({ text: message.messagePayload.globalActions[0].label });
        }
        
      }

      if (idx != 0) {
       
        keyboard.push(keyboard3);
        
      }
      
    }

   
    if (Array.isArray(message.messagePayload.cards)) {
      for (var i = 0; i < message.messagePayload.cards.length; i++) {
        // cards

        cards.push({ text: message.messagePayload.cards[i].title });
      }
    }

    logger.info(JSON.stringify(keyboard));
    logger.info(message.messagePayload.hasOwnProperty("globalActions"));

    var text = "" + message.messagePayload.text;

    if (keyboard.length > 0) {
      var opts = {
        reply_markup: {
          keyboard: keyboard,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      };

      bot.sendMessage(chatId, text, opts);
    } else if (cards.length > 0) {
      var opts = { reply_markup: { inline_keyboard: [cards] } };

      bot.sendMessage(chatId, text, opts);
    } else {
      //var opts = {"reply_markup": { "keyboard": [[]] } };

      bot.sendMessage(chatId, text);
    }
  });

  // Send message to bot.
  bot.on("message", msg => {

    // set chatId variable for use in sendMessage()
    logger.info(msg);
    chatId = msg.from.id;

    
     
    let message = new Object();  

    if (msg.text == "11. Show More") {
      //Postback

      let postbackObject = new Object();
      postbackObject = { state: "GetAgents", action: "system.showMore", variables: {
        "system.state.GetAgents.customsCommandRangeStart": 10
      } };
      logger.info(postbackObject);

      message = {
        userId: chatId.toString(),
        messagePayload: MessageModel.postbackConversationMessage(
          postbackObject, msg.text
        )
      };
    } else {
      //Text
      message = {
        userId: chatId.toString(),
        messagePayload: MessageModel.textConversationMessage(msg.text)
      };
    }
        
    // send to bot webhook channel
    console.log(message);
    webhook.send(message);
  });

  // Create endpoint for bot webhook channel configurtion (Outgoing URI)
  app.post("/bot/message", webhook.receiver());
  // Create endpoint for telegram webhook
  app.post("/bot/telegram", (req, res) => {
    console.log("123457");
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

}
