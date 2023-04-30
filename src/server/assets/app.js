const messagesCont = document.querySelector('#messages');

function addMessage(msg) {
  if (!msg || typeof msg != 'object') return;

  messagesCont.innerHTML += `
    <div class="message">
      <span style="color: ${msg.color}">${msg.displayName}:</span>
      <span class="content">${msg.message}</span>
    </div>
  `;
}

async function startChat() {
  addMessage({
    'displayName': 'Chat',
    'message': 'Conectándose al chat....',
    'color':  '#a6adbb'
  });

  const response = await fetch('/start');
  const resp = await response.json();
  if (resp.join) {
    // Obtenemos los primeros mensajes
    getMessages();

    // Y volvemos a solicitar los mensajes cada 5 segundos
    setInterval(getMessages, 5000);
  } else {
    // Si ha fallado la conexión al chat probamos de nuevo pasados 5 segundos
    console.log('Try join again')
    setTimeout(startChat, 5000);
  }
}

startChat();

async function getMessages() {
  const response = await fetch('/messages');
  const messages = await response.json()
  if (messages && messages.length > 0) {
    messages.forEach( msg => addMessage(msg) );
    const lastMessage = messagesCont.lastElementChild;
    const newMessageStyles = getComputedStyle(lastMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = lastMessage.offsetHeight + newMessageMargin;
    const visibleHeight = messagesCont.offsetHeight;
    const containerHeight = messagesCont.scrollHeight
    const scrollOffset = messagesCont.scrollTop + visibleHeight

    //messagesCont.scrollTop = messagesCont.scrollHeight
    if (containerHeight - newMessageHeight >= scrollOffset) {
      messagesCont.scrollTop = messagesCont.scrollHeight
    }
  }
}