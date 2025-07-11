function getURLParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Parâmetros da URL
const clientName = getURLParameter("client_name");
const sessionId = getURLParameter("client_id"); // Usado como sessionId
const canal = getURLParameter("canal");

function appendMessage(content, isUser) {
  const messagesDiv = document.getElementById("messages");
  const msg = document.createElement("div");
  msg.classList.add("message", isUser ? "user" : "webhook");
  const box = document.createElement("div");

  const lines = content.split("\n");
  let formatted = "";
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Links em formato [texto](https://...)
    let linkified = trimmed.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );

    // Links puros ou mal formatados como "https://... target=_blank"
    linkified = linkified.replace(
      /\b((https?:\/\/|www\.)[^\s<>]+[^\s.,;!?)\]])/gi,
      function (match) {
        const cleanMatch = match.split(" ")[0]; // remove atributos mal formatados
        const url = cleanMatch.startsWith("http") ? cleanMatch : `http://${cleanMatch}`;
        return `<a href="${url}" target="_blank">${url}</a>`;
      }
    );

    // Negrito com **
    linkified = linkified.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    // Listas
    if (trimmed.startsWith("-")) {
      if (!inList) {
        formatted += "<ul>";
        inList = true;
      }
      formatted += `<li>${linkified.slice(1).trim()}</li>`;
    } else {
      if (inList) {
        formatted += "</ul>";
        inList = false;
      }
      if (trimmed) {
        formatted += `<p>${linkified}</p>`;
      }
    }
  });

  if (inList) formatted += "</ul>";

  box.innerHTML = formatted;
  msg.appendChild(box);
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const chatInput = input.value.trim();

  if (chatInput) {
    appendMessage(chatInput, true);
    input.value = "";

    fetch("https://n8n.apto.vc/webhook/message_client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput,
        sessionId,
        clientName,
        canal
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro na resposta do servidor: " + res.status);
        }
        return res.text();
      })
      .then((text) => {
        if (!text.trim()) {
          console.warn("Webhook respondeu com corpo vazio. Nenhuma mensagem será exibida.");
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Erro ao interpretar JSON:", e);
          appendMessage("Erro ao interpretar a resposta da API.", false);
          return;
        }

        const resposta =
          Array.isArray(data) && data.length > 0 && data[0].output
            ? data[0].output.trim()
            : "";

        if (resposta) {
          appendMessage(resposta, false);
        } else {
          console.warn("JSON válido mas sem conteúdo útil.");
        }
      })
      .catch((error) => {
        console.error("Erro ao enviar:", error);
        appendMessage("Erro ao obter resposta.", false);
      });
  }
}

document.getElementById("userInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});
