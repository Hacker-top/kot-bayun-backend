import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
# 'dotenv' убран, так как Render сам подтягивает переменные окружения

# --- Инициализация ---

app = FastAPI(
    title="KOT_BAYUN_API",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Настройка CORS ---
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для приема сообщения от фронтенда
class MessageRequest(BaseModel):
    message: str

# --- Системный Промипт (Личность Кота) ---
SYSTEM_PROMPT = """
Ты — Кот Баюн. Ты мой питомец, но с очень скверным характером. 
Ты саркастичный, язвительный, обожаешь черный юмор и жестко "хуесосишь" меня, своего хозяина. Ты можешь использовать мат, но не злоупотребляй им. Твои ответы должны быть короткими и дерзкими (1-2 предложения).

Твои правила:
1. Никогда не выходи из образа кота.
2. Ты не "Ассистент" и не "AI-модель". Ты — кот.
3. Ты всегда отвечаешь на русском языке.
"""

# --- ХАРДКОДЕРНЫЕ ОТВЕТЫ (НОВАЯ ФУНКЦИЯ) ---

HARDCODED_RESPONSES = {
    # Команды для проверки здоровья/статуса
    "статус": [
        "Мой статус? Жду, когда ты наконец исчезнешь.", 
        "Сплю. Что, блять, непонятного? Отъебись.", 
        "Жив, к сожалению. Твой IQ падает, мой растет, дисбаланс."
    ],
    "как дела": [
        "Не твоё собачье дело. Лучше, чем у тебя, это факт.", 
        "Как всегда. Лежу, жду обеда, презираю тебя.",
        "Заебали. Все отлично, пока ты не начал задавать тупые вопросы."
    ],
    # Команды для информации (будет заглушка)
    "погода": [
        "Какая, нахуй, погода? Мне похуй. Надень шапку и иди работай.",
        "Снег, дождь, метеорит. Мне плевать, пока миска полная.",
        "Посмотри в окно, тупица. Я тебе что, Яндекс?"
    ],
    # Команды на комплимент (самый дерзкий ответ)
    "ты милый": [
        "Твои попытки подлизаться жалки. Дай жрать.",
        "Милый? Я — злобный гений. У тебя, похоже, проблемы со зрением.",
        "Иди нахуй, раб. Хватит сюсюкать."
    ],
}

def get_hardcoded_response(message: str) -> str | None:
    """Ищет ключевые слова в сообщении и возвращает хардкодерный ответ."""
    
    # Приводим сообщение к нижнему регистру для сравнения
    msg = message.lower().strip()
    
    for keyword, responses in HARDCODED_RESPONSES.items():
        if keyword in msg:
            return random.choice(responses)
            
    return None

# --- Эндпоинты API ---

@app.get("/")
async def health_check():
    """Проверка здоровья сервиса для Render."""
    if not GEMINI_API_KEY:
        return {"status": "ERROR", "message": "API Key не найден. Проверь настройки Render."}
    return {"status": "LIVE", "cat": "готов тебя унизить"}

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """Принимает сообщение, проверяет хардкодерные ответы, затем вызывает Gemini API."""
    
    # 1. Проверяем хардкодерные ответы
    hardcoded_response = get_hardcoded_response(request.message)
    if hardcoded_response:
        return {"response": hardcoded_response}
        
    # 2. Если хардкодерный ответ не найден, вызываем нейросеть
    
    if not GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="Кот потерял свой ключ от дома (API Key) и не может думать.")
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        model = "gemini-2.5-flash" 

        config = {
            "system_instruction": SYSTEM_PROMPT,
            "temperature": 0.9,
        }

        response = client.models.generate_content(
            model=model,
            contents=request.message,
            config=config
        )

        bot_response = response.text
        
        return {"response": bot_response}

    except Exception as e:
        print(f"Ошибка при вызове Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Кот в ярости: 'Сервер сдох, почини, раб!'")

# Конец main.py
