const { ChatClient, me } = require("@kararty/dank-twitch-irc");
const express = require('express');
const util = require('util')
const fs = require('fs')
const path = require('path')
const css = require('./assets/style.css')
const events = require('events');
import { homedir } from 'os'

const eventEmitter = new events.EventEmitter();
const DIST_DIR = __dirname;
const HTML_FILE = path.join(DIST_DIR, 'index.html')
const CACHE_DIR = path.join(homedir(), '.cache', 'chatiin');

if (!fs.existsSync(path.join(CACHE_DIR, 'emotes')))
  fs.mkdir(path.join(CACHE_DIR, 'emotes'), { recursive: true}, err => console.error(err));

class Server {
  constructor() {
    this.app = express();
    this.http = require('http');
    this.server = this.http.createServer(this.app);
    this.client = new ChatClient();
    this.streamPipeline = util.promisify(require('stream').pipeline)
    this.chatRoom = ''

    this.messages = [];

    this.app.use(express.static(DIST_DIR));
    this.app.use(express.static(CACHE_DIR));
    this.app.set('eventEmitter', eventEmitter);

    this.app.get('/', (req, res) => {
      res.sendFile(HTML_FILE);
    });

    this.app.get('/start', (req, res) => this.startChat(res));
  }

  on(event, handler) { eventEmitter.on(event, handler) }

  startChat = (res) => {
    if (!this.chatRoom) return;
    
    this.messages = [];
    this.client.connect({
      connectionRateLimits: {
        parallelConnections: 1, // 1 by default
        // time to wait after each connection before a new connection can begin
        releaseTime: 5000, // in milliseconds, 2 seconds by default
      },
    });

    this.client.join(this.chatRoom)
      .then( () => res.json({ join: true }))
      .catch( err => {
        console.error(err);
        res.json({ join: false });
      });

    this.app.get('/messages', (req, res) => {
      res.json(this.messages);
      this.messages = [];
    });
    
    this.client.on("ready", () => {
      this.messages.push({
        'displayName': 'Chat',
        'message': 'Conectado',
        'color':  '#a6adbb'
      });

      eventEmitter.emit('messages', this.messages);
    });
    
    this.client.on('error', err => console.error(err))
    
    this.client.on("close", (error) => {
      if (error != null) {
        console.error("Client closed due to error", error);
      }
    });

    this.client.on("PRIVMSG", (msg) => {
      this.onMessage(msg)
    });
  }

  onMessage = (msg) => {
    if (msg.emotes.length > 0) {
      let message = msg.messageText;

      msg.emotes.forEach(emote => {
        const emoteUrl = this.getEmote(emote.id);
        message = message.replaceAll(emote.code, `<img src="${emoteUrl}" class="emote" />`)
      });

      this.messages.push({
        'displayName': msg.displayName,
        'message': message,
        'color':  msg.colorRaw
      });

    } else {
      this.messages.push({
        'displayName': msg.displayName,
        'message': msg.messageText,
        'color':  msg.colorRaw
      });
    }

    eventEmitter.emit('messages', this.messages);
  }

  startServer = function (chat) {
    this.chatRoom = chat
    const listen = this.server.listen(5000, () => {
      console.log('listening on *:5000');
      return 'Escuchando en el puerto *:5000';
    });

    if (listen) return true;
  }

  getEmote(emote) {
    if (fs.existsSync(path.join(CACHE_DIR, `emotes/${emote}.png`))) return `emotes/${emote}.png`

    this.downEmote(emote);
    return `emotes/${emote}.png`;
    //return `https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/dark/1.0`;
  }

  downEmote = (emote) => {
    //const response = await
    fetch(`https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/dark/1.0`)
    .then(response => {
      if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
      //const type = response.headers.get('Content-Type')
      this.streamPipeline(response.body, fs.createWriteStream(path.join(CACHE_DIR, `emotes/${emote}.png`)))
    });
  }
}

export  {
  Server,
  CACHE_DIR
}