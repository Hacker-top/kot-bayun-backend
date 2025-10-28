import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI # Используем клиента OpenAI

# --- Инициализация FastAPI ---

app = FastAPI(
    title="KOT_BAYUN_API_OPENAI",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

# Ключ OpenAI API будет взят из переменной окружения Render
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Настройка CORS (Разрешает фронтенду стучаться) ---
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для входящего сообщения
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

# --- ХАРДКОДЕРНЫЕ ОТВЕТЫ ---

HARDCODED_RESPONSES = {
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
    "погода": [
        "Какая, нахуй, погода? Мне похуй. Надень шапку и иди работай.",
        "Снег, дождь, метеорит. Мне плевать, пока миска полная.",
        "Посмотри в окно, тупица. Я тебе что, Яндекс?"
    ],
    "ты милый": [
        "Твои попытки подлизаться жалки. Дай жрать.",
        "Милый? Я — злобный гений. У тебя, похоже, проблемы со зрением.",
        "Иди нахуй, раб. Хватит сюсюкать."
    ],
}

def get_hardcoded_response(message: str) -> str | None:
    """Ищет ключевые слова в сообщении и возвращает хардкодерный ответ."""
    msg = message.lower().strip()
    
    for keyword, responses in HARDCODED_RESPONSES.items():
        if keyword in msg:
            return random.choice(responses)
            
    return None

# --- Эндпоинты API ---

@app.get("/")
async def health_check():
    """Проверка здоровья сервиса для Render."""
    if not OPENAI_API_KEY:
        return {"status": "ERROR", "message": "OPENAI API Key не найден. Проверь настройки Render."}
    return {"status": "LIVE", "cat": "готов тебя унизить (на ChatGPT)"}

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """Принимает сообщение, проверяет хардкодерные ответы, затем вызывает OpenAI API."""
    
    # 1. Проверяем хардкодерные ответы
    hardcoded_response = get_hardcoded_response(request.message)
    if hardcoded_response:
        return {"response": hardcoded_response}
        
    # 2. Вызываем OpenAI
    if not OPENAI_API_KEY:
         raise HTTPException(status_code=500, detail="Кот потерял свой ключ от дома (OPENAI API Key) и не может думать.")
    
    try:
        # Инициализируем клиента OpenAI (использует API_KEY)
        client = OpenAI(
            api_key=OPENAI_API_KEY
        )
        
        # Используем быструю и дешевую модель
        model = "gpt-3.5-turbo" 

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message}
            ],
            temperature=0.9
        )

        # Извлекаем ответ
        bot_response = response.choices[0].message.content
        
        return {"response": bot_response}

    except Exception as e:
        # Выводим ошибку в логи Render
        print(f"FATAL OpenAI API Error: {e}") 
        # Если это ошибка 401 (Unauthorized), то фронтенд получит 500 и покажет "Опять сломалось..."
        raise HTTPException(status_code=500, detail="Кот в ярости: 'Сервер сдох, почини, раб!'")
