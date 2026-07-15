marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch(e) {}
        }
        return code;
    },
    breaks: true,
});

const messagesEl   = document.getElementById('messages');
const inputEl      = document.getElementById('input');
const sendBtn      = document.getElementById('send-btn');
const emptyState   = document.getElementById('empty-state');
const emptyWrap    = document.getElementById('empty-input-wrap');
const chatInputArea = document.getElementById('chat-input-area');
const inputContainer = document.getElementById('input-container');
const conversation = [];
let chatMode = false;

function renderMarkdown(text) {
    return DOMPurify.sanitize(marked.parse(text));
}

function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
}

function updateSendBtn() {
    sendBtn.disabled = !inputEl.value.trim() || inputEl.disabled;
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function activateChatMode() {
    if (chatMode) return;
    chatMode = true;
    document.body.classList.add('chat-mode');
    chatInputArea.appendChild(inputContainer);
}

function addMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper';
    const msg = document.createElement('div');
    msg.className = `msg msg-${role}`;

    if (role === 'user') {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        msg.appendChild(bubble);
    } else {
        const header = document.createElement('div');
        header.className = 'msg-header';
        header.innerHTML = `<span class="agent-name">Mokart Agent</span>`;
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = renderMarkdown(text);
        msg.appendChild(header);
        msg.appendChild(bubble);
    }

    wrapper.appendChild(msg);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return { wrapper, msg };
}

inputEl.addEventListener('input', () => {
    autoResize();
    updateSendBtn();
});

inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    activateChatMode();

    addMessage('user', text);
    inputEl.value = '';
    autoResize();
    conversation.push({ role: 'user', content: text });

    // Typing indicator
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper';
    const msg = document.createElement('div');
    msg.className = 'msg msg-assistant';
    const header = document.createElement('div');
    header.className = 'msg-header';
    header.innerHTML = `<span class="agent-name">Mokart Agent</span>`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(typing);
    msg.appendChild(header);
    msg.appendChild(bubble);
    wrapper.appendChild(msg);
    messagesEl.appendChild(wrapper);
    scrollToBottom();

    sendBtn.disabled = true;
    inputEl.disabled = true;
    const startTime = Date.now();
    let typingRemoved = false;
    let statusEl = null;

    function removeTyping() {
        if (!typingRemoved) {
            bubble.removeChild(typing);
            typingRemoved = true;
        }
    }

    function removeStatus() {
        if (statusEl) {
            statusEl.classList.add('removing');
            const el = statusEl;
            setTimeout(() => el.remove(), 300);
            statusEl = null;
        }
    }

    function showStatus(text) {
        removeTyping();
        removeStatus();
        statusEl = document.createElement('div');
        statusEl.className = 'status-indicator';
        statusEl.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
        bubble.appendChild(statusEl);
        scrollToBottom();
    }

    try {
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversation })
        });

        if (!resp.ok) {
            bubble.innerHTML = `<span style="color:var(--error)">Erreur ${resp.status}</span>`;
            return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        removeStatus();
                        removeTyping();
                        bubble.innerHTML = `<span style="color:var(--error)">${json.error}</span>`;
                        return;
                    }
                    const delta = json.choices?.[0]?.delta || {};
                    const status = delta.status;
                    const content = delta.content || '';

                    if (status) {
                        showStatus(status);
                    }
                    if (content) {
                        removeStatus();
                        removeTyping();
                        assistantText += content;
                        bubble.innerHTML = renderMarkdown(assistantText);
                        scrollToBottom();
                    }
                } catch (e) {}
            }
        }

        removeStatus();
        removeTyping();
        if (!assistantText) {
            bubble.textContent = 'Aucune réponse reçue.';
        }
        conversation.push({ role: 'assistant', content: assistantText });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const timeEl = document.createElement('div');
        timeEl.className = 'response-time';
        timeEl.textContent = `${elapsed}s`;
        msg.appendChild(timeEl);
        scrollToBottom();

    } catch (err) {
        removeStatus();
        removeTyping();
        bubble.innerHTML = `<span style="color:var(--error)">Erreur: ${err.message}</span>`;
    } finally {
        inputEl.disabled = false;
        updateSendBtn();
        inputEl.focus();
    }
}

inputEl.focus();
