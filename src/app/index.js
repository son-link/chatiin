/**
 * GUI para iniciar y configurar el chat personalizado
 *
 * @author Alfonso Saavedra "Son Link"
 * @license  GPL-3.0-or-later
 */

// Primero vamos a importar las clases de NodeGUI que vamos a ir usando.
const {
  QBoxLayout,
  QIcon,
  QMainWindow,
  QLabel,
  QLineEdit,
  QPushButton,
  QTextBrowser,
  QWidget
} = require('@nodegui/nodegui');

import { Server, CACHE_DIR } from '../server'
import Icon from './chatiin.svg'

const server = new Server()

const win = new QMainWindow();
win.setMinimumSize(480, 320);
win.setWindowTitle("Chatiin");

const winIcon = new QIcon(__dirname + `${Icon}`);
win.setWindowIcon(winIcon);

const centralWidget = new QWidget();
const rootLayout = new QBoxLayout(2);
centralWidget.setLayout(rootLayout);
win.setCentralWidget(centralWidget);

const hbox1 = new QWidget();
const hbox1_layout = new QBoxLayout(0);
hbox1.setLayout(hbox1_layout);
rootLayout.addWidget(hbox1);

const label1 = new QLabel();
label1.setText('Introduce el chat:');
hbox1_layout.addWidget(label1);

const chatroom = new QLineEdit();
hbox1_layout.addWidget(chatroom);

const btn_start = new QPushButton();
btn_start.setText('Iniciar');
hbox1_layout.addWidget(btn_start);

const messages_browser = new QTextBrowser();
messages_browser.setOpenExternalLinks(true);
rootLayout.addWidget(messages_browser);
messages_browser.setObjectName("messages");

win.show();

global.win = win;

btn_start.addEventListener('clicked', () => {
  const chat = chatroom.text().trim();
  if (!chat) return;
  server.startServer(chat)
  messages_browser.insertHtml(`
      <div class="message">
        <span>Chat</span>:
        <span class="content">Esperando al navegador....</span>
      </div>
      <br />
    `)
});

server.on('messages', (messages) => {
  messages.forEach(msg => {
    const message = msg.message.replace(/emotes\//gi, CACHE_DIR + '/emotes/')
    messages_browser.insertHtml(`
      <div class="message">
        <span style="color: ${msg.color}">${msg.displayName}</span>:
        <span class="content">${message}</span>
      </div>
      <br />
    `)
  });
  messages_browser.reload()
})