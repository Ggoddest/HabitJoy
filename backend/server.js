const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initializeDatabase, run, get, all } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Инициализация базы данных при запуске сервера
initializeDatabase();

if (!YANDEX_API_KEY) {
    console.error('❌ YANDEX_API_KEY не установлен в .env файле!');
    process.exit(1);
}

// Определяем теги/категории для фильтрации цитат
const MOTIVATION_TAGS = ['motivation', 'inspiration', 'success', 'self-improvement', 'habits', 'goals', 'productivity', 'mindset'];

// Функция для получения случайного тега из списка
function getRandomTag() {
    return MOTIVATION_TAGS[Math.floor(Math.random() * MOTIVATION_TAGS.length)];
}

// Функция для получения нескольких случайных тегов
function getRandomTags(count = 2) {
    const shuffled = [...MOTIVATION_TAGS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Список API для получения цитат
const QUOTE_APIS = [
    {
        name: 'Forismatic (русские)',
        url: () => 'https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=ru',
        parser: (data) => ({ 
            text: data.quoteText, 
            author: data.quoteAuthor || 'Неизвестный автор',
            language: 'ru'
        })
    },
    {
        name: 'API Ninjas - Inspiration',
        url: () => 'https://api.api-ninjas.com/v2/quotes?category=inspirational',
        headers: {
            'X-Api-Key': 'eobFHanJdsg1vTCgdmAztQ==YfVCKKlE4gJfU6ZD'
        },
        parser: (data) => {
            if (data && data.length > 0) {
                return { 
                    text: data[0].quote, 
                    author: data[0].author || 'Unknown',
                    language: 'en'
                };
            }
            throw new Error('Нет данных');
        }
    },
    {
        name: 'API Ninjas - Success',
        url: () => 'https://api.api-ninjas.com/v2/quotes?category=success',
        headers: {
            'X-Api-Key': 'eobFHanJdsg1vTCgdmAztQ==YfVCKKlE4gJfU6ZD'
        },
        parser: (data) => {
            if (data && data.length > 0) {
                return { 
                    text: data[0].quote, 
                    author: data[0].author || 'Unknown',
                    language: 'en'
                };
            }
            throw new Error('Нет данных');
        }
    },
    {
        name: 'Stoic Quotes',
        url: () => 'https://stoic-quotes.com/api/quote',
        parser: (data) => ({ 
            text: data.text, 
            author: data.author || 'Stoic Philosopher',
            language: 'en'
        })
    },
    {
        name: 'PaperQuotes',
        url: () => {
            const tags = getRandomTags(1);
            return `https://api.paperquotes.com/apiv1/quotes/?limit=1&random=true&tags=${tags[0]}`;
        },
        headers: {
            'Authorization': 'Token 1014643afbddfa28aabf76f691258df671adac47'
        },
        parser: (data) => {
            const quote = data.results && data.results.length > 0 ? data.results[0] : data;
            return { 
                text: quote.quote || quote.text, 
                author: quote.author || 'Unknown',
                language: quote.language || 'en'
            };
        }
    },
    {
        name: 'ZenQuotes',
        url: () => 'https://zenquotes.io/api/random',
        parser: (data) => {
            if (data && data.length > 0) {
                return { 
                    text: data[0].q, 
                    author: data[0].a || 'Unknown',
                    language: 'en'
                };
            }
            throw new Error('Нет данных');
        }
    },
    {
        name: 'Quoteslate',
        url: () => {
            const tags = getRandomTags(2);
            return `https://quoteslate.vercel.app/api/quotes/random?tags=${tags.join(',')}`;
        },
        parser: (data) => ({ 
            text: data.quote || data.text, 
            author: data.author || 'Unknown',
            language: 'en'
        })
    }
];

// Запасная цитата
const FALLBACK_QUOTE = {
    text: "Самое лучшее время посадить дерево было 20 лет назад. Следующий подходящий момент — сейчас.",
    author: "Китайская пословица",
    language: 'ru'
};

// Функция для определения языка цитаты
function detectLanguage(text) {
    if (!text) return 'unknown';
    
    const russianRegex = /[а-яА-ЯЁё]/;
    const englishRegex = /[a-zA-Z]/;
    
    if (russianRegex.test(text)) return 'ru';
    if (englishRegex.test(text)) return 'en';
    return 'unknown';
}

// Глобальная блокировка для предотвращения параллельных запросов
let isProcessingRequest = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 секунда между запросами

// Функция для получения цитаты из API
async function getQuoteFromAPI(api) {
    try {
        const options = {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                ...api.headers
            }
        };
        
        const url = typeof api.url === 'function' ? api.url() : api.url;
        
        console.log(`🔄 Пробуем API: ${api.name}`);
        
        // Для Forismatic API добавляем специальную обработку
        if (api.name.includes('Forismatic')) {
            try {
                const response = await axios.get(url, {
                    ...options,
                    timeout: 10000
                });
                
                if (!response.data) {
                    throw new Error('Пустой ответ от API');
                }
                
                const quote = api.parser(response.data);
                
                if (!quote.text || quote.text.trim().length < 10) {
                    throw new Error('Недопустимая или слишком короткая цитата');
                }
                
                console.log(`✅ Успешно от ${api.name}: "${quote.text.substring(0, 50)}..."`);
                return {
                    text: quote.text,
                    author: quote.author,
                    language: quote.language,
                    source: api.name,
                    isFallback: false
                };
            } catch (forismaticError) {
                console.log(`❌ Forismatic API ошибка: ${forismaticError.message}`);
                return null;
            }
        }
        
        const response = await axios.get(url, options);
        
        if (!response.data) {
            throw new Error('Пустой ответ от API');
        }
        
        const quote = api.parser(response.data);
        
        if (!quote.text || quote.text.trim().length < 10) {
            throw new Error('Недопустимая или слишком короткая цитата');
        }
        
        if (!quote.language) {
            quote.language = detectLanguage(quote.text);
        }
        
        console.log(`✅ Успешно от ${api.name}: "${quote.text.substring(0, 50)}..."`);
        return {
            text: quote.text,
            author: quote.author,
            language: quote.language,
            source: api.name,
            isFallback: false
        };
    } catch (error) {
        if (error.code === 'CERT_HAS_EXPIRED') {
            console.log(`❌ ${api.name}: Проблема с SSL сертификатом`);
        } else if (error.response) {
            console.log(`❌ ${api.name}: HTTP ${error.response.status} - ${error.response.statusText}`);
            if (error.response.status === 429) {
                console.log(`⚠️  ${api.name}: Превышен лимит запросов, пропускаем`);
            }
        } else if (error.request) {
            console.log(`❌ ${api.name}: Нет ответа от сервера`);
        } else {
            console.log(`❌ ${api.name}: ${error.message}`);
        }
        return null;
    }
}

// Улучшенный кэш с защитой от дублирования
const quotesCache = {
    cache: [],
    maxSize: 15,
    quoteTexts: new Set(), // Для быстрой проверки уникальности
    
    // Проверяем, есть ли уже такая цитата в кэше
    isDuplicate(text) {
        const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
        return this.quoteTexts.has(normalizedText);
    },
    
    add(quote) {
        const normalizedText = quote.text.trim().toLowerCase().replace(/\s+/g, ' ');
        
        // Проверяем на дубликаты
        if (this.quoteTexts.has(normalizedText)) {
            console.log(`⚠️  Цитата уже есть в кэше, не добавляем дубликат`);
            return false;
        }
        
        // Если кэш полон, удаляем самую старую
        if (this.cache.length >= this.maxSize) {
            const removed = this.cache.shift();
            if (removed && removed.normalizedText) {
                this.quoteTexts.delete(removed.normalizedText);
            }
        }
        
        // Добавляем новую цитату
        const cacheEntry = {
            ...quote,
            cachedAt: Date.now(),
            normalizedText: normalizedText
        };
        
        this.cache.push(cacheEntry);
        this.quoteTexts.add(normalizedText);
        
        console.log(`💾 Цитата сохранена в кэш (всего: ${this.cache.length})`);
        return true;
    },
    
    getRandom() {
        if (this.cache.length === 0) return null;
        
        // Получаем случайную цитату, но не последнюю выданную
        let attempts = 0;
        let randomIndex;
        let cachedQuote;
        
        do {
            randomIndex = Math.floor(Math.random() * this.cache.length);
            cachedQuote = this.cache[randomIndex];
            attempts++;
        } while (cachedQuote?.lastUsed && Date.now() - cachedQuote.lastUsed < 5000 && attempts < 10);
        
        // Помечаем как использованную
        if (cachedQuote) {
            cachedQuote.lastUsed = Date.now();
        }
        
        console.log(`📦 Используем цитату из кэша (${randomIndex + 1}/${this.cache.length})`);
        return {
            text: cachedQuote.text,
            author: cachedQuote.author,
            language: cachedQuote.language,
            source: cachedQuote.source + ' (кэш)',
            isFallback: false,
            fromCache: true
        };
    },
    
    // Очистка старых кэшированных цитат
    cleanup() {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const initialLength = this.cache.length;
        
        this.cache = this.cache.filter(quote => {
            if (quote.cachedAt > oneHourAgo) {
                return true;
            } else {
                this.quoteTexts.delete(quote.normalizedText);
                return false;
            }
        });
        
        if (this.cache.length < initialLength) {
            console.log(`🧹 Очищено ${initialLength - this.cache.length} устаревших цитат из кэша`);
        }
    }
};

// Функция для получения цитаты с защитой от параллельных запросов
async function getQuoteFromBestAPI() {
    const now = Date.now();
    
    // Проверяем, не слишком ли частый запрос
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        console.log(`⏳ Слишком частый запрос, используем кэш`);
        if (quotesCache.cache.length > 0) {
            return quotesCache.getRandom();
        }
    }
    
    // Проверяем, не выполняется ли уже запрос
    if (isProcessingRequest) {
        console.log(`⏳ Запрос уже выполняется, используем кэш`);
        if (quotesCache.cache.length > 0) {
            return quotesCache.getRandom();
        }
    }
    
    // Устанавливаем блокировку
    isProcessingRequest = true;
    lastRequestTime = now;
    
    try {
        console.log('\n=== Поиск тематической цитаты ===');
        
        // Очищаем старые цитаты из кэша
        quotesCache.cleanup();
        
        // Сначала пробуем все API по порядку
        let successfulQuote = null;
        
        for (const api of QUOTE_APIS) {
            const quote = await getQuoteFromAPI(api);
            if (quote) {
                successfulQuote = quote;
                
                // Сохраняем в кэш (если не дубликат)
                quotesCache.add(quote);
                break;
            }
            // Ждем перед следующим API
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Если нашли цитату из API, возвращаем её
        if (successfulQuote) {
            return successfulQuote;
        }
        
        // Если все API недоступны, проверяем кэш
        if (quotesCache.cache.length > 0) {
            console.log('📦 Все API недоступны, используем кэш');
            return quotesCache.getRandom();
        }
        
        // Иначе используем запасную цитату
        console.log('❌ Все API недоступны и кэш пуст, используем запасную цитату');
        return {
            text: FALLBACK_QUOTE.text,
            author: FALLBACK_QUOTE.author,
            language: FALLBACK_QUOTE.language,
            source: 'fallback',
            isFallback: true
        };
        
    } finally {
        // Снимаем блокировку
        isProcessingRequest = false;
    }
}

// Функция для перевода через Yandex API
async function translateWithYandex(text, sourceLang = 'en', targetLang = 'ru') {
    try {
        console.log('🔄 Перевод через Yandex API...');
        
        const requestBody = {
            texts: [text],
            targetLanguageCode: targetLang,
            sourceLanguageCode: sourceLang
        };
        
        if (process.env.YANDEX_FOLDER_ID) {
            requestBody.folderId = process.env.YANDEX_FOLDER_ID;
        }
        
        const response = await axios.post(
            'https://translate.api.cloud.yandex.net/translate/v2/translate',
            requestBody,
            {
                headers: {
                    'Authorization': `Api-Key ${YANDEX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        console.log('✅ Перевод успешен');
        return response.data.translations[0].text;
    } catch (error) {
        console.error('❌ Ошибка Yandex API:');
        
        if (error.response) {
            console.error(`   HTTP ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error('   Нет ответа от сервера');
        } else {
            console.error('   Ошибка настройки:', error.message);
        }
        
        throw error;
    }
}

// Функция для перевода через MyMemory (резервный)
async function translateWithMyMemory(text, sourceLang = 'en', targetLang = 'ru') {
    try {
        console.log('🔄 Пробуем перевод через MyMemory...');
        
        const response = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`,
            { timeout: 10000 }
        );
        
        if (response.data.responseStatus === 200) {
            console.log('✅ Перевод через MyMemory успешен');
            return response.data.responseData.translatedText;
        } else {
            throw new Error(`MyMemory error: ${response.data.responseStatus}`);
        }
    } catch (error) {
        console.error('❌ Ошибка MyMemory:', error.message);
        throw error;
    }
}

// Эндпоинт для получения цитаты
app.get('/api/quote', async (req, res) => {
    try {
        // Получаем цитату
        const quote = await getQuoteFromBestAPI();
        
        let finalText = quote.text;
        let author = quote.author;
        let isTranslated = false;
        let translationService = null;
        
        // Если цитата на английском и не запасная, переводим
        if (quote.language === 'en' && !quote.isFallback) {
            try {
                finalText = await translateWithYandex(quote.text);
                isTranslated = true;
                translationService = 'yandex';
            } catch (yandexError) {
                console.log('❌ Yandex не сработал, пробуем MyMemory...');
                try {
                    finalText = await translateWithMyMemory(quote.text);
                    isTranslated = true;
                    translationService = 'mymemory';
                } catch (myMemoryError) {
                    console.log('❌ Все переводчики не работают, оставляем оригинал');
                    // Оставляем на английском
                }
            }
        }
        
        // Если автор неизвестен или пустой, ставим "Неизвестный автор"
        if (!author || author.toLowerCase() === 'unknown' || author === 'Неизвестный автор') {
            author = 'Неизвестный автор';
        }
        
        res.json({
            quote: finalText,
            author: author,
            originalLanguage: quote.language,
            isTranslated: isTranslated,
            translationService: translationService,
            source: quote.source,
            isFallback: quote.isFallback,
            fromCache: quote.fromCache || false,
            cacheSize: quotesCache.cache.length,
            theme: 'Мотивация и самосовершенствование'
        });
        
    } catch (error) {
        console.error('❌ Общая ошибка:', error.message);
        res.json({
            quote: FALLBACK_QUOTE.text,
            author: FALLBACK_QUOTE.author,
            originalLanguage: 'ru',
            isTranslated: false,
            source: 'error',
            isFallback: true,
            theme: 'Мотивация и самосовершенствование'
        });
    }
});

// Эндпоинт для получения списка API и их статуса
app.get('/api/status', async (req, res) => {
    const statuses = [];
    
    for (const api of QUOTE_APIS) {
        try {
            const url = typeof api.url === 'function' ? api.url() : api.url;
            const options = {
                timeout: 5000,
                headers: api.headers || {}
            };
            
            if (api.name.includes('Forismatic')) {
                options.timeout = 10000;
            }
            
            const response = await axios.get(url, options);
            statuses.push({ name: api.name, status: 'online' });
        } catch (error) {
            statuses.push({ 
                name: api.name, 
                status: 'offline',
                error: error.message 
            });
        }
    }
    
    res.json({
        timestamp: new Date().toISOString(),
        totalAPIs: QUOTE_APIS.length,
        workingAPIs: statuses.filter(s => s.status === 'online').length,
        apis: statuses,
        cacheSize: quotesCache.cache.length,
        cacheInfo: {
            maxSize: quotesCache.maxSize,
            uniqueTexts: quotesCache.quoteTexts.size,
            isProcessing: isProcessingRequest,
            lastRequest: new Date(lastRequestTime).toLocaleTimeString()
        }
    });
});

// ==================== MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ ====================

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// ==================== API ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Валидация
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
        }

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем пользователя
        const result = await run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Создаем JWT токен
        const token = jwt.sign(
            { id: result.id, email: email, name: name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Регистрация прошла успешно',
            token: token,
            user: {
                id: result.id,
                name: name,
                email: email
            }
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Валидация
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        // Ищем пользователя
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Получение информации о текущем пользователе
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== API ДЛЯ ПРИВЫЧЕК ====================

// Получить все привычки пользователя
app.get('/api/habits', authenticateToken, async (req, res) => {
    try {
        const habits = await all(
            'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Парсим completed_dates из JSON строки
        const habitsWithParsedDates = habits.map(habit => {
            let completedDates = [];
            try {
                completedDates = JSON.parse(habit.completed_dates || '[]');
            } catch (e) {
                completedDates = [];
            }

            // Вычисляем прогресс за последние 7 дней
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentCompletions = completedDates.filter(date => {
                const completionDate = new Date(date);
                return completionDate >= sevenDaysAgo;
            });

            const progress = Math.min(100, Math.round((recentCompletions.length / 7) * 100));

            return {
                id: habit.id,
                userId: habit.user_id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                completedDates: completedDates,
                progress: progress,
                createdAt: habit.created_at
            };
        });

        res.json(habitsWithParsedDates);
    } catch (error) {
        console.error('Ошибка при получении привычек:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении привычек' });
    }
});

// Создать новую привычку
app.post('/api/habits', authenticateToken, async (req, res) => {
    try {
        const { name, description, category, frequency } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Название привычки обязательно' });
        }

        const result = await run(
            'INSERT INTO habits (user_id, name, description, category, frequency) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, name, description || null, category || null, frequency || 'daily']
        );

        const newHabit = await get('SELECT * FROM habits WHERE id = ?', [result.id]);
        
        res.status(201).json({
            id: newHabit.id,
            userId: newHabit.user_id,
            name: newHabit.name,
            description: newHabit.description,
            category: newHabit.category,
            frequency: newHabit.frequency,
            completedDates: [],
            progress: 0,
            createdAt: newHabit.created_at
        });
    } catch (error) {
        console.error('Ошибка при создании привычки:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании привычки' });
    }
});

// Обновить привычку
app.put('/api/habits/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, frequency } = req.body;

        // Проверяем, что привычка принадлежит пользователю
        const habit = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!habit) {
            return res.status(404).json({ error: 'Привычка не найдена' });
        }

        // Обновляем привычку
        await run(
            'UPDATE habits SET name = ?, description = ?, category = ?, frequency = ? WHERE id = ? AND user_id = ?',
            [name, description || null, category || null, frequency || 'daily', id, req.user.id]
        );

        const updatedHabit = await get('SELECT * FROM habits WHERE id = ?', [id]);
        let completedDates = [];
        try {
            completedDates = JSON.parse(updatedHabit.completed_dates || '[]');
        } catch (e) {
            completedDates = [];
        }

        res.json({
            id: updatedHabit.id,
            userId: updatedHabit.user_id,
            name: updatedHabit.name,
            description: updatedHabit.description,
            category: updatedHabit.category,
            frequency: updatedHabit.frequency,
            completedDates: completedDates,
            createdAt: updatedHabit.created_at
        });
    } catch (error) {
        console.error('Ошибка при обновлении привычки:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении привычки' });
    }
});

// Удалить привычку
app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, что привычка принадлежит пользователю
        const habit = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!habit) {
            return res.status(404).json({ error: 'Привычка не найдена' });
        }

        await run('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
        res.json({ message: 'Привычка успешно удалена' });
    } catch (error) {
        console.error('Ошибка при удалении привычки:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении привычки' });
    }
});

// Отметить привычку как выполненную на сегодня
app.post('/api/habits/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, что привычка принадлежит пользователю
        const habit = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!habit) {
            return res.status(404).json({ error: 'Привычка не найдена' });
        }

        // Парсим completed_dates
        let completedDates = [];
        try {
            completedDates = JSON.parse(habit.completed_dates || '[]');
        } catch (e) {
            completedDates = [];
        }

        // Получаем сегодняшнюю дату в формате YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Проверяем, не была ли привычка уже отмечена сегодня
        if (completedDates.includes(today)) {
            return res.status(400).json({ error: 'Привычка уже отмечена как выполненная сегодня' });
        }

        // Добавляем сегодняшнюю дату
        completedDates.push(today);

        // Сохраняем обновленный список дат
        await run(
            'UPDATE habits SET completed_dates = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(completedDates), id, req.user.id]
        );

        res.json({
            message: 'Привычка отмечена как выполненная',
            completedDates: completedDates
        });
    } catch (error) {
        console.error('Ошибка при отметке привычки:', error);
        res.status(500).json({ error: 'Ошибка сервера при отметке привычки' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📚 Эндпоинт цитат: http://localhost:${PORT}/api/quote`);
    console.log(`📊 Статус API: http://localhost:${PORT}/api/status`);
    console.log(`\n👤 API пользователей:`);
    console.log(`   • POST /api/register - Регистрация`);
    console.log(`   • POST /api/login - Вход`);
    console.log(`   • GET /api/me - Информация о пользователе`);
    console.log(`\n📝 API привычек:`);
    console.log(`   • GET /api/habits - Получить все привычки`);
    console.log(`   • POST /api/habits - Создать привычку`);
    console.log(`   • PUT /api/habits/:id - Обновить привычку`);
    console.log(`   • DELETE /api/habits/:id - Удалить привычку`);
    console.log(`   • POST /api/habits/:id/complete - Отметить выполненной`);
    console.log(`\n🛡️  Защита от дублирования и частых запросов:`);
    console.log(`   • Минимальный интервал между запросами: ${MIN_REQUEST_INTERVAL}мс`);
    console.log(`   • Проверка дубликатов в кэше: включена`);
    console.log(`   • Блокировка параллельных запросов: включена`);
});