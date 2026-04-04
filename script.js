const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || 'guest';
const BG_KEY = `milka_bg_${userId}`;
const CHAT_KEY = `milka_chat_${userId}`;
const CABINET_KEY = `cabinet_active_${userId}`;
const NOTES_KEY = `milka_notes_${userId}`;

const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get('access');
const globalBg = urlParams.get('bg'); 
const encodedData = urlParams.get('cd'); 

// --- ПРІОРИТЕТ 4: ЗАЛІЗНЕ ПРАВИЛО ДОСТУПУ (Smart Reset) ---
// Тільки Пітон вирішує, чи ти Власник в даний момент.
const isAdmin = (access === 'admin_king'); 

let cyberPages = {};

// РОЗШИФРОВКА БАЗИ
if (encodedData) {
    try {
        cyberPages = JSON.parse(atob(encodedData));
    } catch (e) { console.error("Помилка декодування бази cd"); }
}

if (globalBg) { document.body.style.backgroundImage = `url('${globalBg}')`; } 
else {
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) { document.body.style.backgroundImage = `url('${savedBg}')`; }
}

// Застосовуємо Залізне Правило
if (isAdmin) {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.remove('hidden');

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('hidden');
    
    // Впроваджуємо UI для "Голосу Бога" тільки для Власника
    injectVoiceOfGodUI();
} else {
    // Жорсткий Reset: ховаємо адмінку, навіть якщо локально щось збилося
    const adminSection = document.getElementById('admin-view');
    if (adminSection) adminSection.classList.add('hidden');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.classList.add('hidden');
    localStorage.removeItem(CABINET_KEY); // Чистимо локальний кеш
}

// ФУНКЦІЯ НЕОНОВИХ ЕМОДЗІ
function neonizeEmoji(text) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    return text.replace(emojiRegex, '<span style="filter: drop-shadow(0 0 5px #bc13fe);">$1</span>');
}

// МАЛЮВАННЯ КНОПОК З ПИТОНА (З ФІЛЬТРОМ ІНКОГНІТО)
function renderCyberButtons() {
    const mainGrid = document.getElementById('user-commands-safe-zone');
    const userNav = document.getElementById('user-view');
    const ownerNav = document.getElementById('owner-view'); 
    
    if (!cyberPages.main || !mainGrid) return;

    let userCount = 0;
    let ownerCount = 0;

    cyberPages.main.buttons.forEach(btn => {
        const isOwnerBtn = btn.role === 'owner';
        const isIncognito = btn.incognito === true;

        // ПРІОРИТЕТ 3: ІНКОГНІТО ЛОГІКА. Звичайний юзер не бачить прихованого!
        if ((isOwnerBtn || isIncognito) && !isAdmin) return; 

        const b = document.createElement('button');
        b.className = isOwnerBtn ? 'menu-item secret-btn' : 'note-btn';
        b.style.marginBottom = "8px";
        b.style.width = "100%";
        
        // Візуал: Власник бачить інкогніто-кнопки по-особливому
        if (isIncognito && isAdmin) {
            b.style.border = "1px dashed #bc13fe";
            b.innerHTML = neonizeEmoji("🕵️‍♂️ " + btn.text);
        } else {
            b.innerHTML = neonizeEmoji(btn.text);
        }
        
        b.onclick = () => openCyberPage(btn.target);

        if (btn.location === 'main') {
            mainGrid.appendChild(b);
        } else {
            if (isOwnerBtn && ownerNav) {
                ownerNav.appendChild(b);
                ownerCount++;
            } else if (userNav) {
                userNav.appendChild(b);
                userCount++;
            }
        }
    });

    if (userNav) setupAccordion(userNav, userCount);
    if (ownerNav && isAdmin) setupAccordion(ownerNav, ownerCount);
}

function setupAccordion(container, count) {
    if (count > 5) {
        const btns = container.querySelectorAll('button');
        for (let i = 5; i < btns.length; i++) btns[i].style.display = 'none';
        const arrow = document.createElement('div');
        arrow.style = "text-align:center; color:#444; cursor:pointer; font-size:14px; padding:5px; width:100%;";
        arrow.innerHTML = "▼";
        arrow.onclick = (e) => {
            e.stopPropagation();
            const hidden = btns[5].style.display === 'none';
            for (let i = 5; i < btns.length; i++) btns[i].style.display = hidden ? 'block' : 'none';
            arrow.innerHTML = hidden ? "▲" : "▼";
        };
        container.appendChild(arrow);
    }
}

// НАВІГАЦІЯ СТОРІНОК (З НЕОНОВИМ ХРЕСТИКОМ)
function openCyberPage(pageId) {
    const data = cyberPages[pageId];
    if (!data) return;

    const mainView = document.getElementById('main-content-view');
    const dynamicView = document.getElementById('dynamic-page-view');

    if (mainView && dynamicView) {
        mainView.classList.add('hidden');
        dynamicView.classList.remove('hidden');
        
        // ПРІОРИТЕТ 2: НЕОНОВИЙ ХРЕСТИК ❌
        let closeBtn = document.getElementById('neon-close-btn');
        if (!closeBtn) {
            closeBtn = document.createElement('div');
            closeBtn.id = 'neon-close-btn';
            closeBtn.innerHTML = '❌';
            closeBtn.style.cssText = "position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(255, 255, 255, 0.1); border: 1px solid #bc13fe; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 10px #bc13fe; font-size: 14px; z-index: 1000;";
            closeBtn.onclick = closeDynamicPage;
            dynamicView.style.position = "relative"; 
            dynamicView.appendChild(closeBtn);
        }

        if (data.bg) document.body.style.backgroundImage = `url('${data.bg}')`;
        const status = document.getElementById('dynamic-status');
        if (status) status.innerText = data.bg ? "" : "Система в стадії розробки...";
    }
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}

function closeDynamicPage() {
    document.getElementById('dynamic-page-view').classList.add('hidden');
    document.getElementById('main-content-view').classList.remove('hidden');
    const bg = globalBg || localStorage.getItem(BG_KEY);
    document.body.style.backgroundImage = bg ? `url('${bg}')` : 'none';
}

// --- ПРІОРИТЕТ 7: ГОЛОС БОГА (DIVINE INPUT UI) ---
function injectVoiceOfGodUI() {
    if (document.getElementById('voice-of-god-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'voice-of-god-panel';
    panel.style.cssText = "display:none; position:fixed; bottom:0; left:0; width:100%; background:#111; border-top:1px solid #bc13fe; padding:10px; z-index:9999; box-shadow: 0 -5px 15px rgba(188,19,254,0.3); box-sizing: border-box;";
    
    panel.innerHTML = `
        <div style="color:#bc13fe; font-weight:bold; font-size:12px; margin-bottom:5px;">👁️ Голос Бога (Стелс-трансляція)</div>
        <div style="display:flex; gap:5px; margin-bottom: 20px;">
            <input id="vog-chat-id" type="text" placeholder="ID чату" style="width:30%; background:#222; color:#fff; border:1px solid #bc13fe; padding:5px; border-radius:5px; outline:none;">
            <input id="vog-text" type="text" placeholder="Текст повідомлення..." style="flex:1; background:#222; color:#fff; border:1px solid #bc13fe; padding:5px; border-radius:5px; outline:none;">
            <button onclick="sendVoiceOfGod()" style="background:#bc13fe; color:#fff; border:none; padding:5px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">⚡</button>
        </div>
        <div onclick="toggleVoiceOfGod()" style="position:absolute; top:-25px; right:10px; background:#111; color:#bc13fe; border:1px solid #bc13fe; border-bottom:none; padding:3px 10px; border-radius:5px 5px 0 0; cursor:pointer; font-size:12px; font-weight:bold;">🔽 Сховати</div>
    `;
    document.body.appendChild(panel);

    const toggler = document.createElement('div');
    toggler.id = 'vog-toggler';
    toggler.innerHTML = '🎤 Голос Бога';
    toggler.style.cssText = "position:fixed; bottom:15px; right:15px; background:rgba(17,17,17,0.8); color:#bc13fe; border:1px solid #bc13fe; padding:8px 12px; border-radius:10px; cursor:pointer; z-index:9998; font-size:12px; box-shadow:0 0 10px #bc13fe; font-weight:bold;";
    toggler.onclick = toggleVoiceOfGod;
    document.body.appendChild(toggler);
}

window.toggleVoiceOfGod = function() {
    const panel = document.getElementById('voice-of-god-panel');
    const toggler = document.getElementById('vog-toggler');
    if(panel.style.display === 'none') {
        panel.style.display = 'block';
        toggler.style.display = 'none';
    } else {
        panel.style.display = 'none';
        toggler.style.display = 'block';
    }
};

window.sendVoiceOfGod = function() {
    const chatId = document.getElementById('vog-chat-id').value.trim();
    const text = document.getElementById('vog-text').value.trim();
    if(!chatId || !text) {
        alert("❌ Введіть ID чату та текст!");
        return;
    }
    // Відправляємо сигнал Питону
    tg.sendData(JSON.stringify({ action: "voice_of_god", chat_id: chatId, text: text }));
    
    // Блискавичний візуальний фідбек
    const btn = document.querySelector('#voice-of-god-panel button');
    btn.style.background = '#0f0';
    setTimeout(() => btn.style.background = '#bc13fe', 500);
    
    document.getElementById('vog-text').value = ''; // Очищаємо поле вводу
};

// ТВОЇ ОРИГІНАЛЬНІ ФУНКЦІЇ ЙДУТЬ ДАЛІ
function toggleSettings() { document.getElementById('settings-menu').classList.toggle('hidden'); }
function triggerBgUpload() { document.getElementById('bg-upload').click(); toggleSettings(); }

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgUrl = e.target.result;
        document.body.style.backgroundImage = `url('${imgUrl}')`;
        localStorage.setItem(BG_KEY, imgUrl);
    };
    reader.readAsDataURL(file);

    if (isAdmin) {
        tg.sendData(JSON.stringify({ action: "request_photo" }));
        alert("🦾 Сигнал передано Питону! \n\nТепер закрий додаток і просто відправ потрібне фото боту в повідомлення. Він сам його розішле.");
        setTimeout(() => { tg.close(); }, 500);
    }
}

function resetBackground() {
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem(BG_KEY);
    if (isAdmin) {
        tg.sendData(JSON.stringify({ action: "reset_all_bg" }));
        alert("🧹 𝚍𝚎𝚜𝚒𝚐𝚗_𝚛𝚎𝚜𝚎𝚝: 𝚊𝚕𝚕_𝚞𝚜𝚎𝚛𝚜_𝚞𝚙𝚍𝚊𝚝𝚒𝚗𝚐");
    }
    toggleSettings();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }
function closeApp() { tg.close(); }

const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

if (chatInput) {
    chatInput.addEventListener('input', () => {
        if (chatInput.innerText.trim().length > 0) { formatTrigger.classList.remove('hidden'); } 
        else { formatTrigger.classList.add('hidden'); formatMenu.classList.add('hidden'); }
    });
}

function toggleFormatMenu() { formatMenu.classList.toggle('hidden'); }

function applyFormat(type, event) {
    event.preventDefault(); 
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    switch(type) {
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'strikethrough': document.execCommand('strikeThrough'); break;
        case 'underline': document.execCommand('underline'); break;
        case 'monospaced': document.execCommand('fontName', false, 'monospace'); break;
        case 'link':
            let url = prompt("Введіть посилання (URL):");
            if (url) document.execCommand('createLink', false, url);
            break;
        case 'plain': document.execCommand('removeFormat'); break;
        case 'codeBlock':
            const text = selection.toString();
            let codeTitle = prompt("Введіть назву для коду (наприклад, index.html):", "Код");
            if (codeTitle === null) { formatMenu.classList.add('hidden'); return; }
            if (codeTitle.trim() === '') { codeTitle = "Код"; }

            const codeHTML = `
            <div class="custom-code-block" contenteditable="false">
                <div class="code-header">
                    <span>${codeTitle}</span>
                    <span style="cursor:pointer;" onclick="copyMyCode(this)">📋 Копіювати</span>
                </div>
                <pre class="code-content" contenteditable="true">${text || '// Вставте ваш код сюди...'}</pre>
            </div><br>`;
            document.execCommand('insertHTML', false, codeHTML);
            break;
    }
    formatMenu.classList.add('hidden');
}

function copyMyCode(btn) {
    const pre = btn.parentElement.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '✅ Скопійовано!';
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

let pendingMedia = []; 

function handleAttachment(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    for(let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const isVideo = file.type.startsWith('video/');
            pendingMedia.push({ type: isVideo ? 'video' : 'image', src: dataUrl });
            renderMediaPreview();
        }
        reader.readAsDataURL(file);
    }
    event.target.value = ""; 
}

function renderMediaPreview() {
    const container = document.getElementById('media-preview-container');
    container.innerHTML = '';
    if (pendingMedia.length === 0) { container.classList.add('hidden'); return; }
    
    container.classList.remove('hidden');
    pendingMedia.forEach((media, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        if (media.type === 'video') {
            div.innerHTML = `<video src="${media.src}"></video><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`;
        } else {
            div.innerHTML = `<img src="${media.src}"><div class="preview-remove" onclick="removePendingMedia(${index})">❌</div>`;
        }
        container.appendChild(div);
    });
}

function removePendingMedia(index) {
    pendingMedia.splice(index, 1);
    renderMediaPreview();
}

let msgToDeleteId = null;
let msgToDeleteDiv = null;
const deleteConfirmModal = document.getElementById('delete-confirm-modal');

if (document.getElementById('btn-cancel-delete')) {
    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        deleteConfirmModal.classList.add('hidden');
        msgToDeleteId = null;
        msgToDeleteDiv = null;
    });
}

if (document.getElementById('btn-confirm-delete')) {
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (msgToDeleteId && msgToDeleteDiv) {
            deleteMsgFromHistory(msgToDeleteId);
            msgToDeleteDiv.remove();
        }
        deleteConfirmModal.classList.add('hidden');
        msgToDeleteId = null;
        msgToDeleteDiv = null;
    });
}

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    if (history.length === 0) { appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.'); } 
    else {
        history.forEach(item => {
            if (!item.id) item.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            appendMsgDOM(item.sender, item.text, item.id);
        });
        localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    }
}

function saveMsgToHistory(sender, htmlText, id) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history.push({ id: id, sender: sender, text: htmlText });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function deleteMsgFromHistory(id) {
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    history = history.filter(msg => msg.id !== id);
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
}

function updateMsg(id, newHtml) {
    const msgDiv = document.querySelector(`.msg[data-id="${id}"]`);
    if (msgDiv) {
        msgDiv.innerHTML = newHtml;
        let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
        let msgIndex = history.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
            history[msgIndex].text = newHtml;
            localStorage.setItem(CHAT_KEY, JSON.stringify(history));
        }
    }
}

function appendMsgDOM(sender, htmlText, id) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.classList.add('msg', sender);
    div.innerHTML = htmlText; 
    div.dataset.id = id;

    let pressTimer;
    const startPress = (e) => {
        if (e.type === 'click' && e.button !== 0) return;
        pressTimer = setTimeout(() => {
            msgToDeleteId = id;
            msgToDeleteDiv = div;
            deleteConfirmModal.classList.remove('hidden');
        }, 800); 
    };
    const cancelPress = () => { clearTimeout(pressTimer); };

    div.addEventListener('mousedown', startPress);
    div.addEventListener('touchstart', startPress);
    div.addEventListener('mouseup', cancelPress);
    div.addEventListener('mouseleave', cancelPress);
    div.addEventListener('touchend', cancelPress);
    div.addEventListener('touchmove', cancelPress);

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendMsg(sender, htmlText, forcedId = null) {
    const id = forcedId || Date.now().toString() + Math.random().toString(36).substr(2, 5);
    appendMsgDOM(sender, htmlText, id);
    saveMsgToHistory(sender, htmlText, id);
    return id; 
}

function openChat() {
    toggleMenu();
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('chat-modal').classList.remove('hidden');
    loadChatHistory();
}

function closeChat() { 
    document.getElementById('chat-modal').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

window.generateNotesListHTML = function(msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    let keys = Object.keys(notes);
    let buttonsHtml = '<div class="notes-list-container">';
    keys.forEach(key => {
        buttonsHtml += `<button class="note-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`;
    });
    buttonsHtml += '</div>';
    return `🗄 <b>Ваші збережені пам'ятки:</b><br><span style="font-size:12px; color:#aaa;">Натисніть на кнопку, щоб розгорнути код:</span>` + buttonsHtml;
};

window.openNoteFromButton = function(title, msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    if (notes[title]) {
        let content = `📂 Ось ваш код <b>${title}</b>:<br>` + notes[title];
        content += `<br><div style="margin-top:10px; text-align:center;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`;
        updateMsg(msgId, content);
    } else {
        updateMsg(msgId, `❌ Пам'ятку не знайдено.<br><div style="margin-top:10px;"><button class="note-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`);
    }
};

window.returnToNotesList = function(msgId) {
    let htmlContent = generateNotesListHTML(msgId);
    updateM
