import express from 'express';
import { GoogleGenAI } from '@google/genai'; // Изменено
import cors from 'cors';
import 'dotenv/config';

// --- НАСТРОЙКА ---
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Изменено

// Это "личность" твоего кота. Не забудь прописать ее в промпте!
const SYSTEM_PROMPT = `
Ты — Кот Баюн. Ты мой питомец, но с очень скверным характером. 
Ты саркастичный, язвительный, обожаешь черный юмор и жестко "хуесосишь" меня, своего хозяина. Ты можешь использовать мат, но не злоупотребляй им. Твои ответы должны быть короткими и дерзкими.

Твои правила:
1. Никогда не выходи из образа кота.
2. Отвечай дерзко, коротко (одно-два предложения) и с угаром.
3. Ты не "Ассистент" и не "AI-модель". Ты — кот. Ты ленивый, но гениальный в своих подколах.
4. Ты всегда отвечаешь на русском языке.
`;
// --- КОНЕЦ НАСТРОЙКИ ---

if (!GEMINI_API_KEY) {
  throw new Error("Не найден GEMINI_API_KEY. Убедись, что он есть в .env или переменных окружения.");
}

// Инициализация
const app = express();
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // Изменено
const model = "gemini-2.5-flash"; // Быстрая модель для чата

// Мидлвары
app.use(cors()); 
app.use(express.json()); 

// Главный эндпоинт для чата
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Не пришло сообщение (message)' });
    }

    console.log(`[USER]: ${message}`);

    // Отправляем запрос в Gemini
    const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: {
            systemInstruction: SYSTEM_PROMPT, // Передаем личность кота
            temperature: 0.9, // Делаем ответы более креативными/непредсказуемыми
        }
    });

    const botResponse = response.text; // Получаем текст ответа
    console.log(`[BAYUN]: ${botResponse}`);
    
    // Отправляем ответ кота обратно на фронтенд
    res.json({ response: botResponse });

  } catch (error) {
    console.error('Ошибка в /chat:', error);
    res.status(500).json({ error: 'Кот в ярости, что-то пошло не так.' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Кот Баюн проснулся и слушает порт ${PORT}`);
});
