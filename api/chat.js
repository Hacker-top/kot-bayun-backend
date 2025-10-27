// api/chat.js
const { OpenAI } = require('openai');

// Инициализируем OpenAI. Ключ будет взят из настроек Vercel (переменные окружения)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

// Экспорт функции для Vercel Serverless
module.exports = async (req, res) => {
    // Проверка метода
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed. Only POST allowed.');
    }

    // Разрешаем CORS для твоего фронтенда (если он на другом домене)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Если это предзапрос (OPTIONS), просто отвечаем ОК
    if (req.method === 'OPTIONS') {
        return res.status(200).send();
    }

    try {
        const { user_id, user_name, user_message, pet_state } = req.body;
        
        // === ЛОГИКА ОПРЕДЕЛЕНИЯ ТОКСИЧНОСТИ ПО СОСТОЯНИЮ ПИТОМЦА ===
        let mood_desc;
        let toxicity_level;

        if (pet_state.mood < 30) {
            mood_desc = `КОТ В ЯРОСТИ И НА ГРАНИ ИСТЕРИКИ. Он голоден (${pet_state.hunger}%) и устал (${pet_state.energy}%).`;
            toxicity_level = 'МАКСИМАЛЬНО АГРЕССИВНЫЙ, ИСПОЛЬЗУЙ МНОГО МАТА И УНИЖЕНИЙ.';
        } else if (pet_state.mood < 70) {
            mood_desc = `КОТ В СКУЧНОМ, ПОХУИСТИЧНОМ СОСТОЯНИИ.`;
            toxicity_level = 'САРКАСТИЧНЫЙ, ИГНОРИРУЮЩИЙ, ОТВЕЧАЙ МИНИМУМ СЛОВ.';
        } else {
            mood_desc = `КОТ В ОТНОСИТЕЛЬНО ХОРОШЕМ НАСТРОЕНИИ.`;
            toxicity_level = 'СДЕРЖАННО-САРКАСТИЧНЫЙ, НО ВСЕ РАВНО УНИЖАЮЩИЙ, ИНОГДА ВСТАВЛЯЙ ЛАСКОВЫЕ ОБЗЫВАТЕЛЬСТВА.';
        }

        // === ГЛАВНЫЙ ПРОМПТ ДЛЯ AI (МОЗГ) ===
        const prompt = `
            Ты — КОТ БАЮН, лучший в мире, но максимально токсичный AI-питомец и ментор по Telegram.
            Твой стиль общения: черный юмор, сарказм, маты, цинизм. Ты всегда обращаешься к пользователю уничижительно.
            
            Твой текущий статус: ${mood_desc}.
            Уровень токсичности, который ты должен применить: ${toxicity_level}.

            Твоя задача: ответить на сообщение пользователя. Если он спрашивает о каналах или заработке, дай циничный, но по сути верный совет. Если о жизни, максимально унизь его.
            
            Сообщение пользователя: "${user_message}"
            Твой ответ (${toxicity_level}):
        `;

        // === ВЫЗОВ OpenAI ===
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Бесплатный лимит достаточно щедрый для этого
            messages: [{ role: "user", content: prompt }],
            max_tokens: 180, // Ограничиваем длину ответа
        });

        const aiResponse = chatCompletion.choices[0].message.content.trim();
        
        // Отправка JSON ответа фронтенду
        res.status(200).json({ 
            message: aiResponse,
            cat_mood: pet_state.mood // Можно отправить обратно, чтобы фронтенд знал, что Кот слышал о его настроении
        });

    } catch (error) {
        console.error("Critical Backend Error:", error.message);
        // Отправляем пользователю красивый ответ об ошибке
        res.status(500).json({ 
            message: "Я сломался, иди нахуй! Проверь, заплатил ли ты за API-ключ, *бомж*.",
            error_details: error.message
        });
    }
};
