import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI 

# --- Инициализация FastAPI ---

app = FastAPI(
    title="KOT_BAYUN_API_OPENAI",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

# Используем переменную окружения OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") # <-- Проверяем эту переменную

# --- Настройка CORS ---
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageRequest(BaseModel):
    message: str

# ... (SYSTEM_PROMPT и HARDCODED_RESPONSES остаются прежними) ...

@app.get("/")
async def health_check():
    """Проверка здоровья сервиса для Render."""
    if not OPENAI_API_KEY:
        return {"status": "ERROR", "message": "OPENAI API Key не найден."}
    return {"status": "LIVE", "cat": "готов тебя унизить (на ChatGPT)"}

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """Вызывает OpenAI API."""
    
    # 1. Проверяем хардкодерные ответы
    hardcoded_response = get_hardcoded_response(request.message)
    if hardcoded_response:
        return {"response": hardcoded_response}
        
    # 2. Вызываем OpenAI
    if not OPENAI_API_KEY:
         raise HTTPException(status_code=500, detail="Кот потерял свой ключ от дома (OPENAI API Key) и не может думать.")
    
    try:
        # Инициализируем клиента OpenAI (БЕЗ base_url)
        client = OpenAI(
            api_key=OPENAI_API_KEY # <-- Используем ключ OpenAI
        )
        
        model = "gpt-3.5-turbo" 

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message}
            ],
            temperature=0.9
        )

        bot_response = response.choices[0].message.content
        
        return {"response": bot_response}

    except Exception as e:
        print(f"FATAL OpenAI API Error: {e}") 
        raise HTTPException(status_code=500, detail="Кот в ярости: 'Сервер сдох, почини, раб!'")
