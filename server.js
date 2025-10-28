// server.js (Для Render)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/generative-ai');

// Инициализация Express
const app = express();
app.use(cors()); // ВАЖНО для связи с GitHub Pages
app.use(bodyParser.json()); 

// Инициализация Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY 
});

// Эндпоинт для чата, который ждет наш фронтенд
app.post('/api/chat', async (req, res) => {
    try {
        const { user_id, user_name, user_message, pet_state } = req.body;

        // === ЛОГИКА ОПРЕДЕЛЕНИЯ ТОКСИЧНОСТИ (как раньше) ===
        let mood_desc, toxicity_level;
        if (pet_state.mood < 30) {
            mood_desc = `КОТ В ЯРОСТИ И НА ГРАНИ ИСТЕРИКИ. Он голоден (${pet_state.hunger}%) и устал.`;
            toxicity_level = 'МАКСИМАЛЬНО АГРЕССИВНЫЙ, ИСПОЛЬЗУЙ МНОГО МАТА И УНИЖЕНИЙ.';
        } else if (pet_state.mood < 70) {
            mood_desc = `КОТ В СКУЧНОМ, ПОХУИСТИЧНОМ СОСТОЯНИИ.`;
            toxicity_level = 'САРКАСТИЧНЫЙ, ИГНОРИРУЮЩИЙ, ОТВЕЧАЙ МИНИМУМ СЛОВ.';
        } else {
            mood_desc = `КОТ В ОТНОСИТЕЛЬНО ХОРОШЕМ НАСТРОЕНИИ.`;
            toxicity_level = 'СДЕРЖАННО-САРКАСТИЧНЫЙ, НО ВСЕ РАВНО УНИЖАЮЩИЙ, ИНОГДА ВСТАВЛЯЙ ЛАСКОВЫЕ ОБЗЫВАТЕЛЬСТВА.';
        }

        const systemInstruction = `
            Ты — КОТ БАЮН, токсичный AI-питомец. Твой стиль: черный юмор, маты, цинизм. 
            Состояние: ${mood_desc}. Примени уровень токсичности: ${toxicity_level}.
            Пользователь: ${user_name}. Отвечай кратко, до 3 предложений.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: user_message, 
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 150,
            }
        });

        const aiResponse = response.text.trim();
        
        res.status(200).json({ 
            message: aiResponse
        });

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ 
            message: "СЕРВЕР СГОРЕЛ, МУДИЛА! ПРОВЕРЬ LOGS!"
        });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер Render запущен на порту ${PORT}`);
});
