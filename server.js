const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const OracleBot = require('@oracle/bots-node-sdk');

const app = express();
OracleBot.init(app);

 // Telegram bot - webhook config
const telegramToken = 'ADD_YOUR_TELGRAM_BOT_TOKEN';
const telegramURL = 'YOUR_TELEGRAM_WEBHOOK_URL';
const bot = new TelegramBot(telegramToken);

// implement webhook
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;

const channel = {
  url: process.env.BOT_WEBHOOK_URL,
  secret: process.env.BOT_WEBHOOK_SECRET
};
const webhook = new WebhookClient({ channel: channel });
webhook.on(WebhookEvent.ERROR, console.error); // receive errors

// receive bot messages
app.post('/bot/message', webhook.receiver()); // receive bot messages
webhook.on(WebhookEvent.MESSAGE_RECEIVED, message => {
  // format and send to messaging client...
});

// send messages to bot (example)
app.post('/user/message', (req, res) => {
  let message = {/* ... */}; // format according to MessageModel
  webhook.send(message)
    .then(() => res.send('ok'), e => res.status(400).end());
});