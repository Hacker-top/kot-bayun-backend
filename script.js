// !!! ЗАМЕНИ ЭТОТ URL НА URL ТВОЕГО ЗАДЕПЛОЕННОГО БЭКЕНДА (Render.com/Vercel) !!!
const BACKEND_URL = 'https://bayan-cat.onrender.com'; 

// DOM элементы
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatContainer = document.getElementById('chat-container');
const catAnimationContainer = document.getElementById('cat-animation-container');

// Переменные для анимации
let catLottieAnimation;
let isTyping = false;

// --- ФУНКЦИИ УТИЛИТЫ ---

/**
 * Создает и добавляет новое сообщение в чат
 * @param {string} text - Текст сообщения
 * @param {string} sender - 'user' или 'bot'
 */
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    
    // Добавляем сообщение в начало списка (потому что используется flex-direction: column-reverse)
    messagesList.prepend(messageElement); 
    
    // Прокрутка вниз
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Показывает индикатор "Кот печатает..."
 */
function showTypingIndicator() {
    isTyping = true;
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.classList.add('typing-indicator', 'bot-message');
    indicator.textContent = 'Кот Баюн подбирает слова...';
    messagesList.prepend(indicator);
}

/**
 * Скрывает индикатор печати
 */
function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Меняет анимацию кота (если ты найдешь несколько Lottie-файлов)
 * Пока что используется только одна: 'idle'
 * @param {string} animationPath - URL к файлу .json анимации
 */
function loadCatAnimation(animationPath) {
    if (catLottieAnimation) {
        catLottieAnimation.destroy();
    }
    
    catLottieAnimation = lottie.loadAnimation({
        container: catAnimationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationPath // ЗАМЕНИ ЭТО НА СВОЙ LOTTIE JSON URL
    });
}

// --- ОСНОВНАЯ ЛОГИКА ---

/**
 * Отправка сообщения на бэкенд
 */
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;

    // 1. Отображаем сообщение пользователя
    addMessage(message, 'user');
    messageInput.value = '';
    sendButton.disabled = true;

    // 2. Показываем индикатор печати
    showTypingIndicator();
    
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`Сервер ответил ошибкой: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.response;

        // 3. Убираем индикатор и отображаем ответ
        hideTypingIndicator();
        addMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Ошибка при получении ответа от AI:', error);
        hideTypingIndicator();
        addMessage('Кот сбежал. Проверь свой бэкенд.', 'bot');
    } finally {
        sendButton.disabled = false;
    }
}

// --- ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ СОБЫТИЙ ---

function init() {
    if (window.Telegram && Telegram.WebApp) {
        // Инициализация Mini App
        Telegram.WebApp.ready();
        
        // Устанавливаем основную кнопку (опционально)
        Telegram.WebApp.MainButton.setText("Поговорить с котом").show();
        
        // Включаем нативную прокрутку и подгон под клавиатуру
        Telegram.WebApp.expand();

        // 💡 Адаптация под клавиатуру (ВАЖНО!)
        // Этот хендлер позволяет корректно подстраивать интерфейс при открытии/закрытии клавиатуры.
        Telegram.WebApp.onEvent('viewportChanged', () => {
             // Используем CSS-переменную для управления высотой input-панели или чата, 
             // чтобы избежать перекрытия клавиатурой. 
             // В данном коде, Mini App сам делает большую часть работы через Telegram.WebApp.expand().
        });
        
    } else {
        console.warn('Telegram WebApp не обнаружен. Запуск в режиме отладки.');
    }

    // Загрузка анимации кота (Найти Lottie-файл и вставить сюда его URL)
    // !!! ЗАМЕНИ ЭТОТ ПУТЬ НА СВОЙ LOTTIE JSON !!!
    loadCatAnimation('https://assets-v2.lottiefiles.com/a/5a9101d2-0949-436b-967a-e457582b95b8/qK6wTzVd1Q.json'); 

    // Обработчики:
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Приветственное сообщение от Кота Баюна
    addMessage('Ты пришел, ничтожество. Не отвлекай меня от сна, но если что-то нужно — говори, пока я не передумал.', 'bot');
}

init();
