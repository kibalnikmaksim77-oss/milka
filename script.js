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

let cyberPages = { 
    main: { buttons: [] }, 
    burger: { buttons: [] }, 
    pages: {}, 
    pages_bg: {} 
};
let isEditMode = false;
let navStack = []; 

// --- РОЗШИФРОВКА БАЗИ (ВИПРАВЛЕНО ЕМОДЗІ) ---
if (encodedData) {
    try {
        let decodedString;
        try { 
            decodedString = decodeURIComponent(encodedData); 
        } catch (e) { 
            decodedString = decodeURIComponent(escape(atob(encodedData))); 
        }
        const parsed = JSON.parse(decodedString);
        cyberPages = { ...cyberPages, ...parsed };
    } catch (e) { 
        console.error("Помилка декодування бази", e); 
    }
}

// --- ФОН ---
const initGlobalBg = cyberPages.pages_bg && cyberPages.pages_bg['global'];
if (initGlobalBg) { 
    document.body.style.backgroundImage = `url('${initGlobalBg}')`; 
} else if (globalBg) { 
    document.body.style.backgroundImage = `url('${globalBg}')`; 
} else {
    const savedBg = localStorage.getItem(BG_KEY);
    if (savedBg) { 
        document.body.style.backgroundImage = `url('${savedBg}')`; 
    }
}

// --- КАБІНЕТ АДМІНА ---
if (access === 'admin_king' || localStorage.getItem(CABINET_KEY) === 'true') {
    const adminSection = document.getElementById('admin-view');
    if (adminSection) {
        adminSection.classList.remove('hidden');
    }
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.classList.remove('hidden');
    }
}

// --- СУЧАСНИЙ ЕКСТРАКТОР ЕМОДЗІ ---
function neonizeEmoji(text) {
    let firstSpace = text.indexOf(' ');
    if (firstSpace === -1) {
        return text; 
    }
    let emoji = text.substring(0, firstSpace);
    let rest = text.substring(firstSpace + 1);
    return `<span style="filter: drop-shadow(0 0 10px #bc13fe); font-size: 1.2em;">${emoji}</span> ${rest}`;
}

function extractOnlyEmoji(text) {
    const match = text.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    if (match) {
        return match[0];
    } else {
        return '💠';
    }
}

// --- НАВІГАЦІЯ ---
function goHome() {
    navStack = []; 
    const terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) {
        terminal.classList.add('hidden');
        terminal.remove();
    }
    document.getElementById('app-container').classList.remove('hidden');
    hideContextMenu();
    
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) {
        toggleMenu();
    }
}

function goBack() {
    navStack.pop(); 
    if (navStack.length > 0) { 
        renderTerminal(); 
    } else { 
        goHome(); 
    }
}

function openTerminalPage(pageTitle) {
    if(pageTitle.includes('Око Юзера') || pageTitle.includes('Milka Bot') || pageTitle === '🏠') {
        return;
    }
    navStack.push(pageTitle); 
    renderTerminal();
}

// --- ТЕРМІНАЛ ---
function renderTerminal() {
    if (navStack.length === 0) {
        return;
    }
    
    const currentPage = navStack[navStack.length - 1]; 
    
    document.getElementById('app-container').classList.add('hidden');
    hideContextMenu();
    
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) {
        toggleMenu();
    }
    
    let terminal = document.getElementById('dynamic-terminal-page');
    if (terminal) {
        terminal.remove(); 
    }
    
    terminal = document.createElement('div');
    terminal.id = 'dynamic-terminal-page';
    terminal.className = 'neon-border';
    document.body.appendChild(terminal);
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'terminal', '${currentPage}')">⋮</div>`;
    }

    terminal.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-burger" onclick="toggleMenu()">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div class="terminal-title"></div>
            <div class="terminal-right-controls">
                ${dotsHtml}
                <div class="close-cross-btn" onclick="goBack()">❌</div>
            </div>
        </div>
        <div class="terminal-content" id="terminal-buttons-container"></div>
    `;
    
    const pageBg = cyberPages.pages_bg && cyberPages.pages_bg[currentPage];
    if (pageBg) { 
        terminal.style.backgroundImage = `url('${pageBg}')`; 
        terminal.style.backgroundSize = 'cover'; 
    }
    
    terminal.classList.remove('hidden');

    const contentContainer = document.getElementById('terminal-buttons-container');
    contentContainer.style.display = "grid";
    contentContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
    contentContainer.style.gap = "15px";

    if (cyberPages.pages && cyberPages.pages[currentPage]) {
        cyberPages.pages[currentPage].buttons.forEach(btn => {
            if (btn.role === 'owner' && access !== 'admin_king') {
                return;
            }
            
            const wrapper = document.createElement('div');
            wrapper.className = 'btn-wrapper';
            wrapper.dataset.id = btn.text;
            wrapper.dataset.loc = currentPage; 
            
            const b = document.createElement('button');
            b.className = 'cyber-btn';
            if (btn.role === 'owner') {
                b.classList.add('secret-btn');
            }
            
            b.innerHTML = neonizeEmoji(btn.text);
            b.onclick = () => openTerminalPage(btn.text);
            
            wrapper.appendChild(b);
            makeDraggable(wrapper);
            contentContainer.appendChild(wrapper);
        });
    }
}

// --- ОКО ЮЗЕРА ---
function openUserEyeStudio() {
    let modal = document.getElementById('user-eye-studio');
    const adminView = document.getElementById('admin-view'); 

    if (modal) {
        modal.remove();
    }

    modal = document.createElement('div');
    modal.id = 'user-eye-studio';
    modal.className = 'neon-border'; 
    
    let dotsHtml = '';
    if (access === 'admin_king') {
        dotsHtml = `<div class="admin-dots" onclick="toggleContextMenu(event, 'user_eye', 'main')">⋮</div>`;
    }

    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
        <div class="terminal-burger" onclick="toggleMenu()">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div class="terminal-title"></div>
        <div class="terminal-right-controls">
            ${dotsHtml}
            <div class="close-cross-btn" id="close-eye-btn">❌</div>
        </div>
    `;
    modal.appendChild(header);

    const grid = document.createElement('div');
    grid.id = 'user-eye-grid';
    grid.className = 'eye-safe-zone';
    modal.appendChild(grid);
    document.body.appendChild(modal);

    document.getElementById('close-eye-btn').onclick = () => {
        modal.remove();
        hideContextMenu();
        if (adminView) {
            adminView.style.display = 'block'; 
        }
        isEditMode = false; 
    };
    
    if (adminView) {
        adminView.style.display = 'none';
    }

    const globalBgValue = cyberPages.pages_bg && cyberPages.pages_bg['global'];
    if (globalBgValue) {
        modal.style.backgroundImage = `url('${globalBgValue}')`;
        modal.style.backgroundSize = 'cover';
    }
    
    grid.innerHTML = ''; 
    
    const safeZoneGrid = document.createElement('div');
    safeZoneGrid.style.display = "grid";
    safeZoneGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    safeZoneGrid.style.gap = "15px";
    safeZoneGrid.style.width = "100%";
    grid.appendChild(safeZoneGrid);

    if (cyberPages.main && cyberPages.main.buttons) {
        cyberPages.main.buttons.forEach(btn => {
            if (btn.role === 'user' && btn.location === 'main') {
                const wrapper = document.createElement('div');
                wrapper.className = 'btn-wrapper grid-item';
                wrapper.dataset.id = btn.text;
                wrapper.dataset.loc = 'main';
                
                const b = document.createElement('button');
                b.className = 'cyber-btn';
                b.innerHTML = neonizeEmoji(btn.text);
                b.onclick = () => openTerminalPage(btn.text);
                
                wrapper.appendChild(b);
                makeDraggable(wrapper);
                safeZoneGrid.appendChild(wrapper);
            }
        });
    }

    modal.style.display = 'flex';
    
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu.classList.contains('active')) {
        toggleMenu();
    }
}

// --- ДИНАМІЧНЕ МЕНЮ НАЛАШТУВАНЬ ---
let currentLocationForSave = 'main';

function toggleContextMenu(event, type, loc) {
    const menu = document.getElementById('context-menu');
    
    if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        return;
    }
    
    menu.innerHTML = '';
    currentLocationForSave = loc;
    
    if (isEditMode) {
        menu.innerHTML = `
            <button class="settings-item" onclick="saveLayout()">
                <span class="icon-neon" style="border:none;">💾</span> Зберегти порядок
            </button>
            <button class="settings-item" onclick="cancelEditMode()">
                <span class="icon-neon icon-trash"></span> Вийти без збереження
            </button>
        `;
    } else {
        if (type === 'user_eye') {
            menu.innerHTML = `
                <button class="settings-item" onclick="toggleEditMode()">
                    🛠 Режим Конструктора
                </button>
            `;
        } else {
            menu.innerHTML = `
                <button class="settings-item" onclick="triggerBgUpload()">
                    <span class="icon-neon icon-frame"></span> Встановити фон
                </button>
                <button class="settings-item" onclick="resetBackground()">
                    <span class="icon-neon icon-trash"></span> Видалити фон
                </button>
                <button class="settings-item" onclick="toggleEditMode()">
                    🛠 Режим Конструктора
                </button>
            `;
        }
    }

    const rect = event.target.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.right = '20px'; 
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    if(menu) {
        menu.classList.add('hidden');
    }
}

function toggleEditMode() {
    isEditMode = true;
    hideContextMenu();
    renderCyberButtons(); 
    
    if (document.getElementById('user-eye-studio')) {
        openUserEyeStudio();
    }
    if (navStack.length > 0) {
        renderTerminal();
    }
    alert("🛠 Режим Конструктора УВІМКНЕНО. Затисніть та перетягніть кнопку пальцем, потім натисніть 3 крапки щоб зберегти.");
}

function cancelEditMode() {
    isEditMode = false;
    hideContextMenu();
    renderCyberButtons();
    
    if (document.getElementById('user-eye-studio')) {
        openUserEyeStudio();
    }
    if (navStack.length > 0) {
        renderTerminal();
    }
}

function saveLayout() {
    isEditMode = false;
    hideContextMenu();
    
    let wrappers = document.querySelectorAll(`.btn-wrapper[data-loc="${currentLocationForSave}"]`);
    let newOrder = Array.from(wrappers).map(w => w.dataset.id);
    
    tg.HapticFeedback.impactOccurred('heavy');
    tg.sendData(JSON.stringify({ 
        action: "reorder", 
        loc: currentLocationForSave, 
        new_order: newOrder 
    }));
}

// --- СПРАВЖНІЙ СЕНСОРНИЙ DRAG & DROP ІЗ ПРИВИДОМ ---
let draggedEl = null;
let dragGhost = null;

function makeDraggable(wrapper) {
    wrapper.addEventListener('touchstart', function(e) {
        if (!isEditMode || access !== 'admin_king') {
            return;
        }
        
        draggedEl = this;
        tg.HapticFeedback.impactOccurred('medium');

        dragGhost = this.cloneNode(true);
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none';
        dragGhost.style.zIndex = '999999';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.width = this.offsetWidth + 'px';
        dragGhost.style.transform = 'scale(1.05)';

        let touch = e.touches[0];
        dragGhost.style.left = (touch.clientX - this.offsetWidth / 2) + 'px';
        dragGhost.style.top = (touch.clientY - this.offsetHeight / 2) + 'px';
        
        document.body.appendChild(dragGhost);
        this.style.opacity = '0.3'; 
        
    }, {passive: false});

    wrapper.addEventListener('touchmove', function(e) {
        if (!draggedEl || !dragGhost) {
            return;
        }
        
        e.preventDefault(); 
        let touch = e.touches[0];

        dragGhost.style.left = (touch.clientX - draggedEl.offsetWidth / 2) + 'px';
        dragGhost.style.top = (touch.clientY - draggedEl.offsetHeight / 2) + 'px';

        let target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!target) {
            return;
        }
        
        let targetWrapper = target.closest('.btn-wrapper');
        
        if (targetWrapper && targetWrapper !== draggedEl && targetWrapper.dataset.loc === draggedEl.dataset.loc) {
            let rect = targetWrapper.getBoundingClientRect();
            let mid = rect.top + rect.height / 2;
            let parent = draggedEl.parentNode;
            
            if (touch.clientY < mid) {
                parent.insertBefore(draggedEl, targetWrapper);
            } else {
                parent.insertBefore(draggedEl, targetWrapper.nextSibling);
            }
            tg.HapticFeedback.selectionChanged();
        }
    }, {passive: false});

    wrapper.addEventListener('touchend', function(e) {
        if (!draggedEl) {
            return;
        }
        
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
        
        this.style.opacity = '1';
        draggedEl = null;
    });
}

// --- МАЛЮВАННЯ ГМ ТА БУРГЕРА ---
function renderCyberButtons() {
    const mainGrid = document.getElementById('user-commands-safe-zone');
    const userNav = document.getElementById('user-view');
    const ownerNav = document.getElementById('owner-view'); 
    
    if (mainGrid) {
        mainGrid.innerHTML = '';
        mainGrid.style.display = "grid";
        mainGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    }
    
    if (userNav) {
        userNav.innerHTML = '';
    }
    if (ownerNav) {
        ownerNav.innerHTML = '';
    }

    const menuContent = document.querySelector('.menu-content');
    
    if (menuContent && !document.getElementById('home-btn-burger')) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'home-btn-burger';
        homeBtn.innerHTML = '🏠';
        homeBtn.className = 'cyber-btn home-btn-burger';
        homeBtn.onclick = goHome;
        menuContent.insertBefore(homeBtn, menuContent.firstChild);
    }

    if (access === 'admin_king' && !document.getElementById('trigger-eye-btn') && ownerNav) {
        const eyeBtn = document.createElement('button');
        eyeBtn.id = 'trigger-eye-btn';
        eyeBtn.className = 'cyber-btn secret-btn';
        eyeBtn.innerHTML = neonizeEmoji('👁️ Око Юзера');
        eyeBtn.onclick = openUserEyeStudio;
        ownerNav.appendChild(eyeBtn); 
    }

    if (cyberPages.main && cyberPages.main.buttons) {
        cyberPages.main.buttons.forEach((btn) => {
            if (access === 'admin_king') {
                if (btn.role === 'owner') {
                    createButtonElement(btn, 'main', mainGrid);
                }
            } else {
                if (btn.role === 'user') {
                    createButtonElement(btn, 'main', mainGrid);
                }
            }
        });
    }
    
    if (cyberPages.burger && cyberPages.burger.buttons) {
        cyberPages.burger.buttons.forEach((btn) => {
            if(btn.role === 'owner' && ownerNav) {
                createButtonElement(btn, 'burger', ownerNav);
            }
            if(btn.role === 'user' && userNav) {
                createButtonElement(btn, 'burger', userNav);
            }
        });
    }
}

function createButtonElement(btn, location, container) {
    const wrapper = document.createElement('div');
    wrapper.className = `btn-wrapper`;
    wrapper.dataset.id = btn.text;
    wrapper.dataset.loc = location;
    
    const b = document.createElement('button');
    b.className = 'cyber-btn';
    
    if (btn.role === 'owner') {
        b.classList.add('secret-btn');
    }
    
    b.innerHTML = neonizeEmoji(btn.text);
    b.onclick = () => openTerminalPage(btn.text);
    
    wrapper.appendChild(b);
    makeDraggable(wrapper);
    
    if(container) {
        container.appendChild(wrapper);
    }
}

function triggerBgUpload() { 
    const bgUpload = document.getElementById('bg-upload');
    if (bgUpload) {
        bgUpload.click(); 
    }
    hideContextMenu(); 
}

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) { 
            currentPage = navStack[navStack.length - 1]; 
        }
        
        tg.sendData(JSON.stringify({ 
            action: "request_photo", 
            page: currentPage 
        }));
        
        alert(`🦾 Сигнал передано Питону! \n\nВідправ фото боту в повідомлення. Воно встановиться для сторінки: ${currentPage}`);
        
        setTimeout(() => { 
            tg.close(); 
        }, 500);
    }
}

function resetBackground() {
    if (access === 'admin_king') {
        let currentPage = 'global';
        if (navStack.length > 0) { 
            currentPage = navStack[navStack.length - 1]; 
        }
        
        tg.sendData(JSON.stringify({ 
            action: "reset_bg", 
            page: currentPage 
        }));
        
        alert(`🧹 Фон для сторінки ${currentPage} видалено!`);
        
        setTimeout(() => { 
            tg.close(); 
        }, 500);
    }
    hideContextMenu();
}

function toggleMenu() { 
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) {
        sideMenu.classList.toggle('active'); 
    }
}

function closeApp() { 
    tg.close(); 
}

// =======================================================================
// --- ЧАТ, ФОРМАТУВАННЯ ТА ПАМ'ЯТКИ (ПОВНІСТЮ РОЗГОРНУТО ЯК В ОРИГІНАЛІ) ---
// =======================================================================

const chatInput = document.getElementById('chat-input');
const formatTrigger = document.getElementById('format-trigger');
const formatMenu = document.getElementById('format-menu');

if (chatInput) {
    chatInput.addEventListener('input', () => {
        if (chatInput.innerText.trim().length > 0) { 
            formatTrigger.classList.remove('hidden'); 
        } else { 
            formatTrigger.classList.add('hidden'); 
            formatMenu.classList.add('hidden'); 
        }
    });
}

function toggleFormatMenu() { 
    if (formatMenu) {
        formatMenu.classList.toggle('hidden'); 
    }
}

function applyFormat(type, event) {
    event.preventDefault(); 
    const selection = window.getSelection();
    
    if (!selection.rangeCount) {
        return;
    }

    switch(type) {
        case 'bold': 
            document.execCommand('bold'); 
            break;
        case 'italic': 
            document.execCommand('italic'); 
            break;
        case 'strikethrough': 
            document.execCommand('strikeThrough'); 
            break;
        case 'underline': 
            document.execCommand('underline'); 
            break;
        case 'monospaced': 
            document.execCommand('fontName', false, 'monospace'); 
            break;
        case 'link':
            let url = prompt("Введіть посилання (URL):");
            if (url) {
                document.execCommand('createLink', false, url);
            }
            break;
        case 'plain': 
            document.execCommand('removeFormat'); 
            break;
        case 'codeBlock':
            const text = selection.toString();
            let codeTitle = prompt("Введіть назву для коду (наприклад, index.html):", "Код");
            
            if (codeTitle === null) { 
                formatMenu.classList.add('hidden'); 
                return; 
            }
            if (codeTitle.trim() === '') { 
                codeTitle = "Код"; 
            }

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
    
    if (formatMenu) {
        formatMenu.classList.add('hidden');
    }
}

function copyMyCode(btn) {
    const pre = btn.parentElement.nextElementSibling;
    
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '✅ Скопійовано!';
        
        setTimeout(() => { 
            btn.innerText = originalText; 
        }, 2000);
    });
}

let pendingMedia = []; 

function handleAttachment(event) {
    const files = event.target.files;
    if (!files.length) {
        return;
    }
    
    for(let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const isVideo = file.type.startsWith('video/');
            
            pendingMedia.push({ 
                type: isVideo ? 'video' : 'image', 
                src: dataUrl 
            });
            
            renderMediaPreview();
        }
        
        reader.readAsDataURL(file);
    }
    event.target.value = ""; 
}

function renderMediaPreview() {
    const container = document.getElementById('media-preview-container');
    container.innerHTML = '';
    
    if (pendingMedia.length === 0) { 
        container.classList.add('hidden'); 
        return; 
    }
    
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
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.add('hidden');
        }
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
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.add('hidden');
        }
        msgToDeleteId = null;
        msgToDeleteDiv = null;
    });
}

function loadChatHistory() {
    const box = document.getElementById('chat-messages');
    if (!box) {
        return;
    }
    
    box.innerHTML = ''; 
    let history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    
    if (history.length === 0) { 
        appendMsg('bot', 'Система активна. Чекаю на команду, Максиме.'); 
    } else {
        history.forEach(item => {
            if (!item.id) {
                item.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            }
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
    if (!box) {
        return;
    }
    
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
            if (deleteConfirmModal) {
                deleteConfirmModal.classList.remove('hidden');
            }
        }, 800); 
    };
    
    const cancelPress = () => { 
        clearTimeout(pressTimer); 
    };

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
        buttonsHtml += `<button class="cyber-btn" onclick="openNoteFromButton('${key.replace(/'/g, "\\'")}', '${msgId}')">${key}</button>`;
    });
    
    buttonsHtml += '</div>';
    
    return `🗄 <b>Ваші збережені пам'ятки:</b><br><span style="font-size:12px; color:#aaa;">Натисніть на кнопку, щоб розгорнути код:</span>` + buttonsHtml;
};

window.openNoteFromButton = function(title, msgId) {
    let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    if (notes[title]) {
        let content = `📂 Ось ваш код <b>${title}</b>:<br>` + notes[title];
        content += `<br><div style="margin-top:10px; text-align:center;"><button class="cyber-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`;
        updateMsg(msgId, content);
    } else {
        updateMsg(msgId, `❌ Пам'ятку не знайдено.<br><div style="margin-top:10px;"><button class="cyber-btn" onclick="returnToNotesList('${msgId}')">🔙 Повернутися</button></div>`);
    }
};

window.returnToNotesList = function(msgId) {
    let htmlContent = generateNotesListHTML(msgId);
    updateMsg(msgId, htmlContent);
};

let awaitingNote = false;

function sendMessage() {
    const htmlText = chatInput.innerHTML.trim(); 
    const rawText = chatInput.innerText.trim();

    if (!rawText && !htmlText.includes('<img') && !htmlText.includes('<div') && pendingMedia.length === 0) {
        return;
    }
    
    if (awaitingNote) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        const codeHeaderSpan = tempDiv.querySelector('.code-header span:first-child');
        
        if (codeHeaderSpan) {
            const noteTitle = codeHeaderSpan.innerText.trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            notes[noteTitle.toLowerCase()] = htmlText; 
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
            appendMsg('bot', `💾 Код <b>${noteTitle}</b> успішно завантажено в кібер-пам'ять!`);
        } else {
            appendMsg('bot', `❌ Відмінено. Ви не відправили форматований блок коду (через &lt;/&gt;).`);
        }
        
        awaitingNote = false;
        chatInput.innerHTML = '';
        pendingMedia = [];
        renderMediaPreview();
        formatTrigger.classList.add('hidden');
        formatMenu.classList.add('hidden');
        return; 
    }

    let mediaHtml = '';
    
    pendingMedia.forEach(media => {
        if (media.type === 'video') { 
            mediaHtml += `<video src="${media.src}" controls></video><br>`; 
        } else { 
            mediaHtml += `<img src="${media.src}"><br>`; 
        }
    });

    const finalMessageHtml = mediaHtml + htmlText;
    appendMsg('user', finalMessageHtml);
    
    chatInput.innerHTML = '';
    pendingMedia = [];
    renderMediaPreview();
    formatTrigger.classList.add('hidden');
    formatMenu.classList.add('hidden');
    
    setTimeout(() => {
        const lowerText = rawText.toLowerCase();
        
        if (lowerText === '+пам\'ятка' || lowerText === '+пам’ятка') {
            awaitingNote = true;
            appendMsg('bot', 'Що ви хочете зберегти? Відправте текст у вигляді кода (через <b>⋮</b> -> <b>&lt;/&gt;</b>).');
        } 
        else if (lowerText === 'пам\'ятки' || lowerText === 'пам’ятки') {
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            let keys = Object.keys(notes);
            const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            
            if (keys.length === 0) {
                appendMsg('bot', `📭 Ваша кібер-пам'ять наразі порожня.`, msgId);
            } else {
                appendMsg('bot', generateNotesListHTML(msgId), msgId);
            }
        }
        else if (lowerText.startsWith("пам'ятка ") || lowerText.startsWith("пам’ятка ")) {
            const reqTitle = lowerText.replace(/пам['’]ятка /g, "").trim();
            let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
            
            if (notes[reqTitle]) { 
                appendMsg('bot', `📂 Ось ваш код:<br>` + notes[reqTitle]); 
            } else { 
                appendMsg('bot', `❌ Пам'ятку <b>${reqTitle}</b> не знайдено.`); 
            }
        }
        else if (lowerText === 'кабінет') {
            localStorage.setItem(CABINET_KEY, 'true');
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) {
                settingsBtn.classList.remove('hidden');
            }
            appendMsg('bot', 'Режим власника активний.');
        } 
        else if (lowerText === 'вихід') {
            localStorage.removeItem(CABINET_KEY);
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) {
                settingsBtn.classList.add('hidden');
            }
            appendMsg('bot', 'Режим користувача.');
        } 
        else if (lowerText === 'очистити') {
            localStorage.removeItem(CHAT_KEY);
            document.getElementById('chat-messages').innerHTML = '';
            appendMsg('bot', '🧹 Пам\'ять очищено.');
        } 
    }, 600);
}

window.onload = () => {
    renderCyberButtons();
};
