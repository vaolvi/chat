const sessionId = (() => {
  const random = Math.floor(Math.random() * 1000000);
  const timestamp = new Date().toISOString();
  return btoa(timestamp + random);
})();

function appendMessage(content, isUser) {
  const messagesDiv = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message', isUser ? 'user' : 'webhook');
  const box = document.createElement('div');

  // Divide o conteúdo em linhas para formatação
  const lines = content.split('\n');
  let formatted = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Converte [Texto](link) em HTML clicável
    const linkified = trimmed.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    if (trimmed.startsWith('-')) {
      if (!inList) {
        formatted += '<ul>';
        inList = true;
      }
      formatted += `<li>${linkified.slice(1).trim()}</li>`;
    } else {
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      if (trimmed) {
        formatted += `<p>${linkified}</p>`;
      }
    }
  });

  if (inList) formatted += '</ul>';

  box.innerHTML = formatted;
  msg.appendChild(box);
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const chatInput = input.value.trim();

  if (chatInput) {
    appendMessage(chatInput, true);
    input.value = '';

    fetch('https://n8n.apto.vc/webhook/message_client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput, sessionId })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Retorno da API:', data);
      const resposta = Array.isArray(data) && data.length > 0 && data[0].output
        ? data[0].output
        : 'Resposta inesperada da API.';
      appendMessage(resposta, false);
    })
    .catch(error => {
      console.error('Erro ao enviar:', error);
      appendMessage('Erro ao obter resposta.', false);
    });
  }
}

document.getElementById('userInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});