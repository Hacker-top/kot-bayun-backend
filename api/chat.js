// api/chat.js (Переделано под Google Gemini API)
const { GoogleGenAI } = require('@google/generative-ai');

// Инициализируем Gemini. Ключ будет взят из настроек Vercel
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY 
});

// Экспорт функции для Vercel Serverless
module.exports = async (req, res) => {
    // Настройки для CORS, чтобы фронтенд мог общаться
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).send();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // Тело запроса (отправлено фронтендом)
        const { user_message, pet_state, user_name } = req.body;
        
        let mood_desc, toxicity_level;
        
        // Определение состояния и уровня токсичности Кота
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

        // === ГЛАВНЫЙ ПРОМПТ ДЛЯ AI ===
        const systemInstruction = `
            Ты — КОТ БАЮН, лучший в мире, но максимально токсичный AI-питомец и ментор по Telegram.
            Твой стиль: черный юмор, сарказм, маты, цинизм. Ты всегда унижаешь пользователя ${user_name}.
            Текущее состояние Кота: ${mood_desc}. Примени уровень токсичности: ${toxicity_level}.
            Отвечай на русском языке. Ответ должен быть кратким и не превышать 3 предложений.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Быстрая и бесплатная модель
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
            message: `Я СЛОМАЛСЯ, ${user_name}! ${error.message.substring(0, 50)}. Иди почини меня, *лох*.`,
        });
    }
};
