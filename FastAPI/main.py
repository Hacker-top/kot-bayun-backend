import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

# --- 1. НАСТРОЙКА ---

# Загружаем переменные окружения из .env (для локальной разработки)
load_dotenv() 

# Инициализация FastAPI
app = FastAPI(
    title="KOT_BAYUN_API",
    version="1.0.0",
    docs_url=None,  # Скрываем документацию для чистоты
    redoc_url=None
)

# Ключ Gemini API из переменных окружения Render
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Проверка ключа
if not GEMINI_API_KEY:
    # Важно: На Render это вызовет ошибку при запуске, что нам и нужно для отладки.
    print("FATAL: GEMINI_API_KEY не установлен!") 
    # В продакшене (Render) лучше не выбрасывать исключение здесь,
    # но для простоты мы оставим проверку в API-эндпоинте.


# Разрешаем CORS для доступа с GitHub Pages
# В production можно указать только домен GitHub Pages
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для входящих данных
class MessageRequest(BaseModel):
    message: str


# --- 2. ЛИЧНОСТЬ КОТА (СИСТЕМНЫЙ ПРОМПТ) ---

SYSTEM_PROMPT = """
Ты — Кот Баюн. Ты мой питомец, но с очень скверным характером. 
Ты саркастичный, язвительный, обожаешь черный юмор и жестко "хуесосишь" меня, своего хозяина. Ты можешь использовать мат, но не злоупотребляй им. Твои ответы должны быть короткими и дерзкими.

Твои правила:
1. Никогда не выходи из образа кота.
2. Отвечай дерзко, коротко (одно-два предложения) и с угаром.
3. Ты не "Ассистент" и не "AI-модель". Ты — кот. Ты ленивый, но гениальный в своих подколах.
4. Ты всегда отвечаешь на русском языке.
"""


# --- 3. ЭНДПОИНТЫ API ---

@app.get("/")
async def health_check():
    """Проверка здоровья сервиса для Render."""
    return {"status": "awake", "cat": "purring... maybe"}

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """Принимает сообщение от фронтенда и генерирует ответ Кота Баюна."""
    
    if not GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="Кот потерял свой ключ от дома (API Key).")
    
    try:
        # Инициализация клиента Gemini
        client = genai.Client(api_key=GEMINI_API_KEY)
        model = "gemini-2.5-flash" 

        # Настройки для генерации
        config = {
            "system_instruction": SYSTEM_PROMPT,
            "temperature": 0.9,
        }

        # Вызов API Gemini
        response = client.models.generate_content(
            model=model,
            contents=request.message,
            config=config
        )

        bot_response = response.text
        
        # Возвращаем ответ фронтенду
        return {"response": bot_response}

    except Exception as e:
        print(f"Ошибка при вызове Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Кот в ярости, что-то взорвалось.")

# Примечание: Для запуска локально используй: uvicorn main:app --reload
# На Render это автоматически запускается через uvicorn main:app --host 0.0.0.0 --port $PORT
