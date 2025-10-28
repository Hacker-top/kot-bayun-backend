import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

# --- Инициализация ---

app = FastAPI(
    title="KOT_BAYUN_API",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

# Ключ Gemini API будет автоматически взят из переменных окружения Render
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Настройка CORS (Обязательно для связи с фронтендом) ---
origins = ["*"] # Разрешаем любой домен (потом можно ограничить только GitHub Pages)

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


# --- Эндпоинты API ---

@app.get("/")
async def health_check():
    """Проверка здоровья сервиса для Render."""
    if not GEMINI_API_KEY:
        return {"status": "ERROR", "message": "API Key не найден. Проверь настройки Render."}
    return {"status": "LIVE", "cat": "готов тебя унизить"}

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """Генерирует ответ Кота Баюна с использованием Gemini API."""
    
    if not GEMINI_API_KEY:
         # Это нужно для случаев, когда ключ не установлен на Render
         raise HTTPException(status_code=500, detail="Кот потерял свой ключ от дома (API Key).")
    
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
        # Возвращаем понятную ошибку, чтобы фронтенд мог ее обработать
        raise HTTPException(status_code=500, detail="Кот в ярости: 'Сервер сдох, почини, раб!'")

# Конец main.py
