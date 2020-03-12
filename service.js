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
  const telegramURL = "https://ciara-on-telegram.herokuapp.com/bot/telegram";
  const bot = new TelegramBot(telegramToken);
  //bot.setWebHook( telegramURL );
  // variable to store chatId
  var chatId;
  
  // add webhook integration
  const webhook = new WebhookClient({
    channel: {
      url:
        "https://botlhr1I0010H1229EAbots-mpaasocimt.botmxp.ocp.oraclecloud.com:443/connectors/v1/tenants/idcs-6d466372210e4300bb31f4db15e8e96c/listeners/webhook/channels/223e7ae6-adbe-4309-9b9b-88282715c9d3",
      secret: "1Oi77SmG9x0iBrpGKTT6WyvUOkHirp6s"
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
    //localStorage to store the current value of the 'Show More' button
    //window.sessionStorage;
    // if (localStorage.getItem("rangeStart") === null) {
    //   localStorage.setItem("rangeStart", "10");
    // } else {
    //   if (Number(localStorage("rangeStart") == 40)) {
    //     localStorage.setItem("rangeStart", "10");
    //   }
    // }
    let lRangeStart;
   

    if (msg.text == "11. Show More") {
      //use local storage to store the current value of "Show More" button.
      if (typeof localStorage === "undefined" || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
      }
       
      
      if (localStorage.getItem("rangeStart") === null) {
        localStorage.setItem("rangeStart", "10");
      } else {
        lRangeStart = Number(localStorage.getItem("rangeStart"));
        if (lRangeStart == 40) {
          localStorage.setItem("rangeStart", "10");
        }
      }
      
      console.log(localStorage.getItem('rangeStart'));

      lRangeStart = Number(localStorage.getItem("rangeStart"));
      let postbackObject = new Object();
      postbackObject = { state: "GetAgents", action: "system.showMore", variables: {
        "system.state.GetAgents.customsCommandRangeStart": lRangeStart
      } };

      lRangeStart += 10;
      localStorage.setItem("rangeStart", lRangeStart);

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
