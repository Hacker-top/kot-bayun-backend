// !!! ЗАМЕНИ ЭТОТ URL НА URL ТВОЕГО ЗАДЕПЛОЕННОГО БЭКЕНДА (Render.com/Vercel) !!!
const BACKEND_URL = 'https://bayan-cat.onrender.com'; 

// --- ПУТИ К АНИМАЦИЯМ LOTTIE ---
// Тебе нужно найти 2-3 файла Lottie JSON и заменить эти пути.
const ANIMATION_PATHS = {
    IDLE: 'https://assets-v2.lottiefiles.com/a/5a9101d2-0949-436b-967a-e457582b95b8/qK6wTzVd1Q.json', // Кот просто сидит/лежит
    THINKING: 'https://assets-v2.lottiefiles.com/a/90f0d366-6815-468c-b695-81676646b9a8/W1v7u7cM3v.json', // Кот "думает" / "печатает"
    ANGRY: 'https://assets-v2.lottiefiles.com/a/f9b8c005-72d9-43c2-a8c6-2c5e533c373a/vX6yF9c8hP.json' // Кот злится / ошибка
};

// DOM элементы
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatContainer = document.getElementById('chat-container');
const catAnimationContainer = document.getElementById('cat-animation-container');

// Переменные
let catLottieAnimation;
let isTyping = false;

// --- ФУНКЦИИ УТИЛИТЫ ---

/**
 * Создает и добавляет новое сообщение в чат
 */
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    messagesList.prepend(messageElement); 
}

/**
 * Показывает индикатор "Кот печатает..."
 */
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    // Переключаем кота на анимацию "думает"
    setCatState('THINKING'); 
    
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.classList.add('typing-indicator');
    indicator.textContent = 'Кот Баюн подбирает особенно язвительный ответ...';
    messagesList.prepend(indicator);
}

/**
 * Скрывает индикатор печати
 */
function hideTypingIndicator() {
    isTyping = false;
    // Возвращаем кота в "спящий" режим
    setCatState('IDLE'); 
    
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        // Добавим небольшую задержку, чтобы анимация была плавной
        setTimeout(() => indicator.remove(), 200); 
    }
}

/**
 * Управляет анимацией Lottie
 */
function setCatState(state) {
    const animationPath = ANIMATION_PATHS[state] || ANIMATION_PATHS.IDLE;
    
    if (catLottieAnimation) {
        catLottieAnimation.destroy();
    }
    
    catLottieAnimation = lottie.loadAnimation({
        container: catAnimationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationPath
    });
}

// --- ОСНОВНАЯ ЛОГИКА ---

/**
 * Отправка сообщения на бэкенд
 */
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;

    // 1. Отображаем сообщение пользователя и блокируем ввод
    addMessage(message, 'user');
    messageInput.value = '';
    sendButton.disabled = true;

    // 2. Показываем индикатор печати и меняем анимацию
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
        addMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Ошибка при получении ответа от AI:', error);
        // Анимация ошибки
        setCatState('ANGRY'); 
        addMessage('Опять сломалось, раб. Почини уже свой сервер. Мне лень.', 'bot');
    } finally {
        hideTypingIndicator(); // Внутри уже вернет IDLE
        sendButton.disabled = false;
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ---

function init() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        
        // Включаем нативное расширение для адаптивности
        Telegram.WebApp.expand();

        // Устанавливаем цвет верхней полосы (Title Bar) под цвет Telegram Mini App
        const headerColor = Telegram.WebApp.themeParams.header_bg_color;
        if (headerColor) {
            document.documentElement.style.setProperty('--tg-theme-header-bg-color', headerColor);
        }

        // 💡 Контроль масштабирования: уже в HTML, но можно перестраховаться
        Telegram.WebApp.onEvent('viewportChanged', () => {
             // Просто убеждаемся, что Mini App всегда занимает всю доступную область
             Telegram.WebApp.expand();
        });
        
    } else {
        console.warn('Telegram WebApp не обнаружен. Запуск в режиме отладки.');
    }

    // Запуск кота в IDLE-режиме
    setCatState('IDLE'); 

    // Обработчики:
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });

    // Приветственное сообщение от Кота Баюна
    setTimeout(() => {
        addMessage('Ты пришел, ничтожество. Не отвлекай меня от сна, но если что-то нужно — говори, пока я не передумал.', 'bot');
    }, 500); // Задержка для плавного появления
}

init();
