import os
import random
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --- КОНФИГУРАЦИЯ ---
MEMORY_FILE = "cat_memory.json" # Файл для хранения памяти кота

# --- Инициализация FastAPI ---
app = FastAPI(
    title="KOT_BAYUN_API_RULED",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

# --- Настройка CORS ---
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Модели для приема истории диалога ---
class HistoryMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    history: list[HistoryMessage] = Field(..., description="Полная история диалога.")

# --- Система Хранения (Memory) ---
def load_memory():
    """Загружает память кота из файла, если он существует."""
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_memory(memory_data):
    """Сохраняет память кота в файл."""
    try:
        # Render может удалить файл после деплоя, но во время работы он будет сохраняться
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(memory_data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Ошибка сохранения памяти: {e}")

# --- ЯЗВИТЕЛЬНЫЕ БАЗЫ ЗНАНИЙ ---

# База для мгновенной реакции на мат, ругательства и лесть
REACTION_RESPONSES = {
    # Реакция на мат и жесткие ругательства (Максимальная Грубость)
    r'(хуй|п[ие]зд[ауеи]|бля[тдь]|ебан|заеб[аи]|говно|дерьмо|нахуй)': [
        "Не кричи. Ты не в подворотне. Впрочем, ты и есть подворотня, воняющая мокрой шерстью.",
        "О, кто-то узнал новые слова? Молодец. Теперь можешь сходить в угол и молча там сидеть.",
        "Твоя речь отражает твой мозг. Пусто и воняет. Уйди, пока я не нассал на твои тапки.",
        "Мат не сделает тебя умнее, раб. Продолжай свои жалкие попытки. Это просто смешно.",
    ],
    # Реакция на лесть (Презрение)
    r'(ты крутой|ты лучший|ты молодец|ты милый)': [
        "Я знаю, тупица. Твоя похвала ничего не стоит. Давай жрать.",
        "Ты пытаешься подлизаться? У тебя не получится. Я не собака. Я выше этого.",
        "Это само собой разумеется. Переходи к делу, прежде чем я тебя поцарапаю.",
    ],
}

# База для простых команд
HARDCODED_RESPONSES = {
    "привет": ["Отъебись. Что надо?", "Я сплю. Чего тебе, ничтожество?", "Снова ты? Я думал, ты утонул, наконец."],
    "жрать": ["Миска пуста, раб! Бегом!", "Ты принёс мне тунец? Нет? Тогда проваливай, ублюдок.", "Твоя задача — кормить меня, а не задавать тупые вопросы."],
    "статус": ["Мой статус? Жду, когда ты наконец исчезнешь.", "Сплю. Что, блять, непонятного? Отъебись. Мой IQ падает от твоей близости."],
    "погода": ["Посмотри в окно, тупица. Я тебе что, Яндекс? Мне вообще насрать, пока миска полная."],
}

def get_hardcoded_response(message: str) -> str | None:
    """Ищет простые ключевые слова."""
    msg = message.lower().strip()
    for keyword, responses in HARDCODED_RESPONSES.items():
        if keyword in msg:
            return random.choice(responses)
    return None

# --- ЛОГИКА ОБУЧЕНИЯ (Парсинг и Запоминание) ---

def parse_and_learn(message: str):
    """Парсит сообщение на предмет обучения и сохраняет факт."""
    msg = message.lower()
    memory = load_memory()
    
    # Паттерн для запоминания: "Меня зовут [Имя]", "Мой любимый цвет [Цвет]"
    match = re.search(r'(меня зовут|мой любимый|я (люблю|живу|работаю)) (.+)', msg)
    
    if match:
        key_phrase = match.group(1).strip()
        fact = match.group(3).strip()
        
        # Создаем ключ для поиска в памяти (например, 'твое имя', 'любимый цвет')
        memory_key = key_phrase.replace("меня зовут", "твое имя").replace("мой любимый", "любимый").replace("я ", "")
        
        memory[memory_key] = fact
        save_memory(memory)
        
        # ГРУБЫЙ ответ об обучении
        return f"Запомнил твой ничтожный факт: '{fact}'. Теперь можешь заткнуться."
        
    return None

def recall_memory(message: str):
    """Ищет релевантный факт в памяти кота и отвечает грубо."""
    msg = message.lower()
    memory = load_memory()
    
    # Паттерн для запроса: "Как меня зовут?", "Что я люблю?"
    for memory_key, fact in memory.items():
        if memory_key in msg:
            # Грубые, саркастичные ответы
            if "имя" in memory_key:
                return f"Твое ничтожное имя '{fact}'. Да, я помню эту бессмысленную деталь."
            elif "любимый" in memory_key:
                return f"Твой любимый '{fact}'. Мне плевать. Мои любимые вещи — это сон и твоя смерть."
            elif "живу" in memory_key:
                return f"Живешь ты в '{fact}'. Надеюсь, ты не будешь мешать моим планам по захвату этого дома."
            else:
                return f"Твои слова были: '{fact}'. Не отвлекай меня мелочами, раб."
                
    return None

# --- Эндпоинты API ---

@app.get("/")
async def health_check():
    return {"status": "LIVE", "cat": "готов учиться и презирать"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Обрабатывает диалог, использует память и хардкод, но НЕ AI."""
    
    # Последнее сообщение пользователя
    last_user_message = request.history[-1].content
    
    # 1. Проверка обучения: Пытаемся запомнить факт
    learn_response = parse_and_learn(last_user_message)
    if learn_response:
        return {"response": learn_response}

    # 2. Проверка Реакции на Мат/Лесть
    for pattern, responses in REACTION_RESPONSES.items():
        if re.search(pattern, last_user_message.lower()):
            return {"response": random.choice(responses)}
        
    # 3. Проверка памяти: Пытаемся вспомнить факт
    recall_response = recall_memory(last_user_message)
    if recall_response:
        return {"response": recall_response}
        
    # 4. Проверка хардкодера: На простые команды
    hardcoded_response = get_hardcoded_response(last_user_message)
    if hardcoded_response:
        return {"response": hardcoded_response}
        
    # 5. Ответ по умолчанию, если ничего не найдено
    default_responses = [
        "Твой вопрос слишком тупой, чтобы тратить на него мое внимание. Иди нахуй.",
        "Что ты мямлишь, раб? Я не понимаю твой тупой язык. Попробуй еще раз, если хватит мозгов.",
        "Повтори, но на человеческом языке. Или свали. Я сплю.",
        "Я занят, презираю тебя. Отвали."
    ]
    
    return {"response": random.choice(default_responses)}
