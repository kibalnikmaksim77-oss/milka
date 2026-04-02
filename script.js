body {
    margin: 0; padding: 0; 
    background-color: #0e0e0e; /* Глибокий матовий чорний */
    color: #fff; 
    font-family: 'Segoe UI', sans-serif;
    overflow: hidden;
}

#app-container {
    width: 100vw; height: 100vh;
    display: flex; flex-direction: column;
    justify-content: space-between; 
    align-items: center;
    padding: 20px; padding-bottom: 30px; box-sizing: border-box;
}

#burger-btn { position: absolute; top: 20px; left: 20px; cursor: pointer; z-index: 10; }
#burger-btn span { display: block; width: 30px; height: 3px; background: #bc13fe; margin: 6px 0; box-shadow: 0 0 10px #bc13fe; border-radius: 2px; }

#exit-btn {
    background: transparent; border: 2px solid #bc13fe;
    color: #fff; padding: 15px 50px; border-radius: 40px;
    font-weight: bold; font-size: 16px;
    box-shadow: 0 0 15px rgba(188, 19, 254, 0.4), inset 0 0 10px rgba(188, 19, 254, 0.2);
    cursor: pointer;
}

#main-content {
    flex-grow: 1; display: flex; flex-direction: column; 
    justify-content: center; align-items: center; width: 100%;
}

/* Виїзне меню */
#side-menu {
    position: fixed; top: 0; left: 0; width: 80%; max-width: 300px; height: 100%;
    background: rgba(15, 15, 15, 0.98); border-right: 2px solid #bc13fe;
    padding: 20px; box-sizing: border-box;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-100%); z-index: 100;
}
#side-menu.open { transform: translateX(0); }
.menu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #fff;}
.menu-item { display: block; width: 100%; padding: 15px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: white; text-align: left; border-radius: 8px; cursor: pointer;}
.divider { height: 2px; background: #bc13fe; margin: 30px 0 15px 0; box-shadow: 0 0 10px #bc13fe; }
.secret-btn { border-color: #bc13fe; box-shadow: 0 0 10px rgba(188, 19, 254, 0.3); color: #bc13fe; font-weight: bold; }

/* Інтерфейс чату з ботом */
#chat-modal {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: #000; z-index: 200;
    display: flex; flex-direction: column;
}
.chat-header {
    padding: 20px; background: #111; border-bottom: 1px solid #bc13fe;
    display: flex; justify-content: space-between; align-items: center;
    font-weight: bold; color: #bc13fe; box-shadow: 0 0 15px rgba(188, 19, 254, 0.2);
}
#chat-messages {
    flex-grow: 1; padding: 20px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 15px;
}
.msg { max-width: 80%; padding: 10px 15px; border-radius: 15px; font-size: 15px; line-height: 1.4; word-wrap: break-word;}
.msg.bot { background: #1a1a1a; border: 1px solid #333; align-self: flex-start; border-bottom-left-radius: 2px;}
.msg.user { background: #bc13fe; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; box-shadow: 0 0 10px rgba(188, 19, 254, 0.4);}

.chat-input-area {
    padding: 15px; background: #111; border-top: 1px solid #333;
    display: flex; gap: 10px; align-items: center;
}
#chat-input {
    flex-grow: 1; padding: 12px; border-radius: 20px; border: none;
    background: #222; color: #fff; outline: none; font-size: 15px;
}
#chat-input:focus { box-shadow: 0 0 8px #bc13fe; }
.send-btn {
    background: #bc13fe; color: #fff; border: none; width: 45px; height: 45px;
    border-radius: 50%; font-size: 18px; cursor: pointer; box-shadow: 0 0 10px #bc13fe;
}

.hidden { display: none !important; }

/* Стиль Кабінету після активації */
.cabinet-title { color: #bc13fe; text-align: center; text-shadow: 0 0 15px #bc13fe; margin-top: 20px; font-size: 24px;}
.cabinet-status { color: #888; text-align: center; font-size: 15px; margin-top: 15px;}
