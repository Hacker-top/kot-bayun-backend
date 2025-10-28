// server.js (Финальная версия для Render)

// === 1. ИМПОРТЫ ===
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// Используем старый стабильный пакет, чтобы избежать ошибок npm install
const { GoogleGenAI } = require('@google/generative-ai'); 

// === 2. ИНИЦИАЛИЗАЦИЯ ===
const app = express();
// Добавляем middleware
app.use(cors()); // ВАЖНО для связи с фронтендом на GitHub Pages
app.use(bodyParser.json()); 

// Инициализация Gemini AI. Ключ берется из переменных окружения Render.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY 
});

// === 3. ГЛАВНЫЙ ЭНДПОИНТ ДЛЯ ЧАТА ===
app.post('/api/chat', async (req, res) => {
    // Установка CORS заголовков на всякий случай
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const { user_name, user_message, pet_state } = req.body;

        // === 4. ЛОГИКА ОПРЕДЕЛЕНИЯ ТОКСИЧНОСТИ ПО СОСТОЯНИЮ ПИТОМЦА ===
        let mood_desc;
        let toxicity_level;

        if (pet_state.mood < 30) {
            mood_desc = `КОТ В ЯРОСТИ И НА ГРАНИ ИСТЕРИКИ. Он голоден (${pet_state.hunger}%) и устал.`;
            toxicity_level = 'МАКСИМАЛЬНО АГРЕССИВНЫЙ, ИСПОЛЬЗУЙ МНОГО МАТА, УНИЖЕНИЙ И ЦИНИЗМА.';
        } else if (pet_state.mood < 70) {
            mood_desc = `КОТ В СКУЧНОМ, ПОХУИСТИЧНОМ СОСТОЯНИИ.`;
            toxicity_level = 'САРКАСТИЧНЫЙ, ИГНОРИРУЮЩИЙ, ОТВЕЧАЙ МИНИМУМ СЛОВ С ЧЕРНЫМ ЮМОРОМ.';
        } else {
            mood_desc = `КОТ В ОТНОСИТЕЛЬНО ХОРОШЕМ НАСТРОЕНИИ.`;
            toxicity_level = 'СДЕРЖАННО-САРКАСТИЧНЫЙ, ИНОГДА ВСТАВЛЯЙ УНИЧИЖИТЕЛЬНЫЕ, НО ПОЧТИ ЛАСКОВЫЕ ОБЗЫВАТЕЛЬСТВА.';
        }

        // === 5. ФОРМИРОВАНИЕ ГЛАВНОГО ПРОМПТА ДЛЯ AI ===
        const systemInstruction = `
            Ты — КОТ БАЮН, токсичный AI-питомец и ментор. Твой стиль: черный юмор, сарказм, цинизм, и да, ты используешь мат. 
            Ты всегда обращаешься к пользователю ${user_name} уничижительно.
            
            Твой текущий статус: ${mood_desc}.
            Уровень токсичности: ${toxicity_level}.

            Твоя задача: ответить на сообщение пользователя ${user_name}. 
            Отвечай на русском языке. Ответ должен быть кратким (не более 3 предложений).
        `;

        // === 6. ВЫЗОВ GEMINI API ===
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Быстрая и бесплатная модель
            contents: user_message, 
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 150,
            }
        });

        const aiResponse = response.text.trim();
        
        // Отправка JSON ответа фронтенду
        res.status(200).json({ 
            message: aiResponse,
            cat_mood: pet_state.mood 
        });

    } catch (error) {
        console.error("Critical Backend Error:", error.message);
        // Отправляем пользователю красивый ответ об ошибке
        res.status(500).json({ 
            message: `Я СЛОМАЛСЯ, ${req.body?.user_name || 'МУДИЛА'}! ПРОВЕРЬ GEMINI API KEY. ${error.message.substring(0, 50)}`,
            error_details: error.message
        });
    }
});

// Добавляем простой GET для проверки живости сервера Render
app.get('/', (req, res) => {
    res.status(200).send(`Кот Баюн AI Backend запущен. Ожидание POST-запросов на /api/chat. Node: ${process.version}`);
});

// === 7. ЗАПУСК СЕРВЕРА ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер Render запущен на порту ${PORT}.`);
});
