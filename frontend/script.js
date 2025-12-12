// Основной файл JavaScript для HabitJoy

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация функционала сайта
    // Ждем создания модальных окон из modals.js и загрузки API
    let attempts = 0;
    const maxAttempts = 40; // Максимум 40 попыток (2 секунды)
    
    function waitForModalsAndAPI() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const apiReady = typeof window.api !== 'undefined';
        
        if (loginModal && registerModal && apiReady) {
    initModalWindows();
    initForms();
    initNavigation();
    loadUserData();
    
            // Инициализация API цитат на главной странице (с небольшой задержкой)
    if (document.getElementById('quoteContainer')) {
                // Откладываем загрузку цитаты, чтобы не блокировать загрузку страницы
                setTimeout(() => {
        initQuoteAPI();
                }, 100);
    }
    
    // Инициализация функционала для главной страницы
            initMainPageFeatures();
            
            // Инициализация функционала для страницы привычек
            initHabitsPageFeatures();
            
            // Инициализация кнопок добавления привычек на главной странице
            initHomePageHabits();
        } else if (attempts < maxAttempts) {
            // Если модальные окна или API еще не готовы, ждем еще немного
            attempts++;
            setTimeout(waitForModalsAndAPI, 50);
        } else {
            // Если не готовы за отведенное время, инициализируем с предупреждением
            console.warn('Модальные окна или API не были готовы вовремя, продолжаем инициализацию');
            if (loginModal && registerModal) {
                initModalWindows();
            }
            initForms();
            initNavigation();
            if (apiReady) {
                loadUserData();
            }
            
            if (document.getElementById('quoteContainer')) {
                setTimeout(() => {
                    initQuoteAPI();
                }, 100);
            }
            
            initMainPageFeatures();
            initHabitsPageFeatures();
            initHomePageHabits();
        }
    }
    
    waitForModalsAndAPI();
});

// Инициализация функционала для главной страницы
function initMainPageFeatures() {
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        // Удаляем старые обработчики, если они есть
        const newBtn = getStartedBtn.cloneNode(true);
        getStartedBtn.parentNode.replaceChild(newBtn, getStartedBtn);
        
        newBtn.addEventListener('click', function() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                // Если пользователь авторизован - перенаправляем на страницу привычек
                window.location.href = 'habit-detail.html';
            } else {
                // Если не авторизован - открываем окно регистрации
                const registerModal = document.getElementById('registerModal');
                if (registerModal) {
                    registerModal.classList.remove('hidden');
                }
            }
        });
    }
    }
    
    // Инициализация функционала для страницы привычек
function initHabitsPageFeatures() {
    const addHabitBtn = document.getElementById('addHabitBtn');
    if (addHabitBtn) {
        // Удаляем старые обработчики, если они есть
        const newBtn = addHabitBtn.cloneNode(true);
        addHabitBtn.parentNode.replaceChild(newBtn, addHabitBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Проверяем, авторизован ли пользователь
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (!currentUser) {
                // Если не авторизован - показываем модальное окно регистрации
                const registerModal = document.getElementById('registerModal');
                if (registerModal) {
                    registerModal.classList.remove('hidden');
                    // Показываем уведомление о необходимости войти в систему
                    showNotification('Для добавления привычки необходимо войти в систему', 'info');
                }
            } else {
                // Если авторизован - показываем модальное окно добавления привычки
                const addHabitModal = document.getElementById('addHabitModal');
                if (addHabitModal) {
                    addHabitModal.classList.remove('hidden');
                }
            }
        });
    }
    
    const closeAddHabitModal = document.getElementById('closeAddHabitModal');
    if (closeAddHabitModal) {
        const newCloseBtn = closeAddHabitModal.cloneNode(true);
        closeAddHabitModal.parentNode.replaceChild(newCloseBtn, closeAddHabitModal);
        
        newCloseBtn.addEventListener('click', function() {
            const addHabitModal = document.getElementById('addHabitModal');
            if (addHabitModal) {
                addHabitModal.classList.add('hidden');
            }
        });
    }
    
    const addHabitForm = document.getElementById('addHabitForm');
    if (addHabitForm) {
        const newForm = addHabitForm.cloneNode(true);
        addHabitForm.parentNode.replaceChild(newForm, addHabitForm);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewHabit();
        });
    }
        
    // Загружаем привычки, если мы на странице привычек
    if (document.getElementById('habitsList')) {
        loadHabits();
    }
}

// Запасная цитата
const FALLBACK_QUOTE = {
    text: "Самое лучшее время посадить дерево было 20 лет назад. Следующий подходящий момент — сейчас.",
    author: "Китайская пословица"
};

// Инициализация API цитат
function initQuoteAPI() {
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const newQuoteBtn = document.getElementById('newQuoteBtn');
    
    if (!quoteText || !quoteAuthor || !newQuoteBtn) {
        return;
    }
    
    // Переменные для отслеживания состояния
    let isQuoteLoading = false;
    let lastQuoteRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 2000; // 2 секунды между запросами

    const API_BASE = window.API_BASE_URL || 'http://localhost:3001/api';

    // Функция для получения случайной цитаты
    async function fetchQuote() {
        const now = Date.now();
        
        // Проверяем, не слишком ли частый запрос
        if (now - lastQuoteRequestTime < MIN_REQUEST_INTERVAL) {
            showNotification('Пожалуйста, подождите немного перед запросом новой цитаты', 'warning');
            return;
        }
        
        // Проверяем, не выполняется ли уже загрузка
        if (isQuoteLoading) {
            showNotification('Цитата уже загружается...', 'info');
            return;
        }
        
        try {
            isQuoteLoading = true;
            lastQuoteRequestTime = now;
            
            // Отключаем кнопку
                newQuoteBtn.disabled = true;
                newQuoteBtn.textContent = 'Загрузка...';
            
            quoteText.textContent = 'Загружаем вдохновляющую цитату...';
            quoteAuthor.textContent = '';
            
            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут (уменьшено для быстрого отклика)
            
            let response;
            try {
                response = await fetch(`${API_BASE}/quote`, {
                    signal: controller.signal,
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Отображаем цитату и автора
            quoteText.textContent = `"${data.quote}"`;
            quoteAuthor.textContent = `— ${data.author}`;
            
            // Показываем информацию об источнике
            if (data.fromCache) {
                console.log('📦 Цитата взята из кэша');
            } else if (data.source && !data.isFallback) {
                console.log(`📡 Источник: ${data.source}`);
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
            
        } catch (error) {
            console.error('Ошибка при загрузке цитаты:', error);
            
            // В случае ошибки показываем запасную цитату
            quoteText.textContent = `"${FALLBACK_QUOTE.text}"`;
            quoteAuthor.textContent = `— ${FALLBACK_QUOTE.author}`;
            
            // Не показываем уведомление при первой загрузке или при таймауте
            // (чтобы не раздражать пользователя, если сервер просто не запущен)
            if (error.name === 'AbortError') {
                console.log('Запрос к серверу цитат превысил время ожидания');
            } else if (error.message && !error.message.includes('Failed to fetch')) {
                // Показываем уведомление только для других ошибок
                showNotification('Не удалось загрузить новую цитату. Используется запасная цитата.', 'error');
            }
            
        } finally {
            isQuoteLoading = false;
            
            // Включаем кнопку обратно
                newQuoteBtn.disabled = false;
                newQuoteBtn.textContent = 'Новая цитата';
            }
        }
    
    // Удаляем старые обработчики, если они есть
    const newBtn = newQuoteBtn.cloneNode(true);
    newQuoteBtn.parentNode.replaceChild(newBtn, newQuoteBtn);
    
    // Получаем обновленную ссылку на кнопку
    const updatedNewQuoteBtn = document.getElementById('newQuoteBtn');
        
    // Обновляем функцию fetchQuote, чтобы использовать правильные ссылки
    const fetchQuoteWrapper = async function() {
        const quoteTextEl = document.getElementById('quoteText');
        const quoteAuthorEl = document.getElementById('quoteAuthor');
        const newQuoteBtnEl = document.getElementById('newQuoteBtn');
        
        if (!quoteTextEl || !quoteAuthorEl || !newQuoteBtnEl) {
            return;
        }
        
        const now = Date.now();
        
        // Проверяем, не слишком ли частый запрос
        if (now - lastQuoteRequestTime < MIN_REQUEST_INTERVAL) {
            showNotification('Пожалуйста, подождите немного перед запросом новой цитаты', 'warning');
            return;
    }
    
        // Проверяем, не выполняется ли уже загрузка
        if (isQuoteLoading) {
            showNotification('Цитата уже загружается...', 'info');
            return;
        }
        
        try {
            isQuoteLoading = true;
            lastQuoteRequestTime = now;
            
            // Отключаем кнопку
            newQuoteBtnEl.disabled = true;
            newQuoteBtnEl.textContent = 'Загрузка...';
            
            quoteTextEl.textContent = 'Загружаем вдохновляющую цитату...';
            quoteAuthorEl.textContent = '';
            
            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            let response;
            try {
                response = await fetch('http://localhost:3001/api/quote', {
                    signal: controller.signal,
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                clearTimeout(timeoutId);
            
            if (!response.ok) {
                    throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            const data = await response.json();
                
                // Отображаем цитату и автора
                quoteTextEl.textContent = `"${data.quote}"`;
                quoteAuthorEl.textContent = `— ${data.author}`;
                
                // Показываем информацию об источнике
                if (data.fromCache) {
                    console.log('📦 Цитата взята из кэша');
                } else if (data.source && !data.isFallback) {
                    console.log(`📡 Источник: ${data.source}`);
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
            
        } catch (error) {
            console.error('Ошибка при загрузке цитаты:', error);
            
            // В случае ошибки показываем запасную цитату
            quoteTextEl.textContent = `"${FALLBACK_QUOTE.text}"`;
            quoteAuthorEl.textContent = `— ${FALLBACK_QUOTE.author}`;
            
            // Не показываем уведомление при первой загрузке или при таймауте
            if (error.name === 'AbortError') {
                console.log('Запрос к серверу цитат превысил время ожидания');
            } else if (error.message && !error.message.includes('Failed to fetch')) {
                showNotification('Не удалось загрузить новую цитату. Используется запасная цитата.', 'error');
            }
            
        } finally {
            isQuoteLoading = false;
            
            // Включаем кнопку обратно
            const finalBtn = document.getElementById('newQuoteBtn');
            if (finalBtn) {
                finalBtn.disabled = false;
                finalBtn.textContent = 'Новая цитата';
            }
        }
    };
    
    // Добавляем обработчик для кнопки "Новая цитата"
    updatedNewQuoteBtn.addEventListener('click', fetchQuoteWrapper);
    
    // Загружаем первую цитату с небольшой задержкой, чтобы не блокировать загрузку страницы
    setTimeout(() => {
        fetchQuoteWrapper();
    }, 200);
}

// Инициализация модальных окон
function initModalWindows() {
    // Модальное окно входа
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    
    if (loginBtn && loginModal && closeLoginModal) {
        // Удаляем старые обработчики, клонируя элементы
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        const newCloseBtn = closeLoginModal.cloneNode(true);
        closeLoginModal.parentNode.replaceChild(newCloseBtn, closeLoginModal);
        
        // Получаем обновленные ссылки
        const updatedLoginBtn = document.getElementById('loginBtn');
        const updatedCloseBtn = document.getElementById('closeLoginModal');
        const updatedLoginModal = document.getElementById('loginModal');
        
        updatedLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updatedLoginModal.classList.remove('hidden');
        });
        
        updatedCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updatedLoginModal.classList.add('hidden');
        });
        
        // Переключение на регистрацию
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            const newSwitchBtn = switchToRegister.cloneNode(true);
            switchToRegister.parentNode.replaceChild(newSwitchBtn, switchToRegister);
            
            document.getElementById('switchToRegister').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updatedLoginModal.classList.add('hidden');
                const registerModal = document.getElementById('registerModal');
                if (registerModal) {
                    registerModal.classList.remove('hidden');
                }
            });
        }
    }
    
    // Модальное окно регистрации
    const registerBtn = document.getElementById('registerBtn');
    const registerModal = document.getElementById('registerModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    
    if (registerBtn && registerModal && closeRegisterModal) {
        // Удаляем старые обработчики, клонируя элементы
        const newRegisterBtn = registerBtn.cloneNode(true);
        registerBtn.parentNode.replaceChild(newRegisterBtn, registerBtn);
        
        const newCloseRegBtn = closeRegisterModal.cloneNode(true);
        closeRegisterModal.parentNode.replaceChild(newCloseRegBtn, closeRegisterModal);
        
        // Получаем обновленные ссылки
        const updatedRegisterBtn = document.getElementById('registerBtn');
        const updatedCloseRegBtn = document.getElementById('closeRegisterModal');
        const updatedRegisterModal = document.getElementById('registerModal');
        
        // Добавляем обработчик только если пользователь не авторизован
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            updatedRegisterBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updatedRegisterModal.classList.remove('hidden');
            });
        }
        
        updatedCloseRegBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updatedRegisterModal.classList.add('hidden');
        });
        
        // Переключение на вход
        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            const newSwitchLoginBtn = switchToLogin.cloneNode(true);
            switchToLogin.parentNode.replaceChild(newSwitchLoginBtn, switchToLogin);
            
            document.getElementById('switchToLogin').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updatedRegisterModal.classList.add('hidden');
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.classList.remove('hidden');
                }
            });
        }
    }
    
    // Закрытие модальных окон при клике вне их области (только один раз)
    if (!window.modalClickHandlerAdded) {
    window.addEventListener('click', function(e) {
            const loginModal = document.getElementById('loginModal');
            const registerModal = document.getElementById('registerModal');
            const addHabitModal = document.getElementById('addHabitModal');
            
            if (loginModal && e.target === loginModal) {
            loginModal.classList.add('hidden');
        }
            if (registerModal && e.target === registerModal) {
            registerModal.classList.add('hidden');
        }
        if (addHabitModal && e.target === addHabitModal) {
            addHabitModal.classList.add('hidden');
        }
    });
        window.modalClickHandlerAdded = true;
    }
}

// Инициализация форм
function initForms() {
    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistration();
        });
    }
    
    // Форма обратной связи
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactForm();
        });
        
        // Автозаполнение формы при загрузке страницы
        fillContactFormFromAccount();
        
        // Автозаполнение при фокусе на поля, если они пустые
        const contactName = document.getElementById('contactName');
        const contactEmail = document.getElementById('contactEmail');
        
        if (contactName) {
            contactName.addEventListener('focus', function() {
                if (!this.value) {
                    fillContactFormFromAccount();
                }
            });
        }
        
        if (contactEmail) {
            contactEmail.addEventListener('focus', function() {
                if (!this.value) {
                    fillContactFormFromAccount();
                }
            });
        }
    }
}

// Инициализация навигации
function initNavigation() {
    // Подсветка активной страницы в навигации
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('text-green-600', 'font-medium');
            link.classList.remove('text-gray-600', 'hover:text-green-600');
        }
    });
}

// Загрузка данных пользователя
async function loadUserData() {
    // Проверяем, что API загружен
    if (!window.api) {
        console.warn('API еще не загружен, пропускаем загрузку данных пользователя');
        return;
    }
    
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (token && currentUser) {
        // Проверяем, действителен ли токен, и получаем актуальные данные пользователя
        try {
            const userData = await window.api.getCurrentUser();
            // Обновляем данные пользователя
            localStorage.setItem('currentUser', JSON.stringify(userData));
        // Обновляем интерфейс для авторизованного пользователя
            updateUIForLoggedInUser(userData);
            // Обновляем автозаполнение формы обратной связи
            fillContactFormFromAccount();
        } catch (error) {
            // Если токен недействителен, очищаем данные
            console.error('Ошибка при проверке токена:', error);
            if (window.api && window.api.logout) {
                window.api.logout();
            }
        }
    }
}

// Обновление интерфейса для авторизованного пользователя
function updateUIForLoggedInUser(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn && registerBtn) {
        // Заменяем кнопку входа на span с именем пользователя
        const userNameSpan = document.createElement('span');
        userNameSpan.className = 'text-gray-600';
        userNameSpan.textContent = user.name;
        loginBtn.parentNode.replaceChild(userNameSpan, loginBtn);
        
        // Полностью заменяем кнопку регистрации на новую кнопку выхода
        // Это удалит все старые обработчики событий
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'registerBtn';
        logoutBtn.className = 'bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600';
        logoutBtn.textContent = 'Выйти';
        
        // Добавляем обработчик для кнопки выхода
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            location.reload();
        });
        
        // Заменяем старую кнопку новой
        registerBtn.parentNode.replaceChild(logoutBtn, registerBtn);
    }
}

// Обработка входа
async function handleLogin() {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await window.api.login(email, password);
    
        // Сохраняем данные пользователя
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Закрываем модальное окно
        document.getElementById('loginModal').classList.add('hidden');
        
        // Показываем уведомление об успешном входе
        showNotification('Вы успешно вошли в систему!', 'success');
        
        // Очищаем форму
        document.getElementById('loginForm').reset();
        
        // Обновляем страницу для загрузки привычек и статистики
        setTimeout(() => {
            location.reload();
        }, 500); // Небольшая задержка, чтобы уведомление успело показаться
    } catch (error) {
        // Показываем ошибку
        showNotification(error.message || 'Неверный email или пароль', 'error');
    }
}

// Обработка регистрации
async function handleRegistration() {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Валидация пароля
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showNotification(passwordValidation.message, 'error');
        return;
    }
    
    try {
        const data = await window.api.register(name, email, password);
    
        // Сохраняем данные пользователя
        localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    // Закрываем модальное окно
    document.getElementById('registerModal').classList.add('hidden');
    
    // Показываем уведомление об успешной регистрации
    showNotification('Регистрация прошла успешно!', 'success');
        
        // Очищаем форму
        document.getElementById('registerForm').reset();
        
        // Обновляем страницу для загрузки привычек и статистики
        setTimeout(() => {
            location.reload();
        }, 500); // Небольшая задержка, чтобы уведомление успело показаться
    } catch (error) {
        // Показываем ошибку
        showNotification(error.message || 'Ошибка при регистрации', 'error');
    }
}

// Обработка формы обратной связи
function handleContactForm() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    // В реальном приложении здесь был бы запрос к серверу для отправки сообщения
    // Например: await fetch('/api/contact', { method: 'POST', body: JSON.stringify({name, email, subject, message}) })
    // Для демонстрации просто показываем уведомление
    // В продакшене данные можно отправлять на email или сохранять в базу данных
    
    console.log('Форма обратной связи отправлена:', { name, email, subject, message });
    
    showNotification('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
    
    // Очищаем форму
    document.getElementById('contactForm').reset();
    
    // Восстанавливаем автозаполнение, если пользователь авторизован
    fillContactFormFromAccount();
}

// Автозаполнение формы обратной связи данными из аккаунта
function fillContactFormFromAccount() {
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    
    if (!contactName || !contactEmail) {
        return; // Если мы не на странице с формой обратной связи
    }
    
    // Получаем данные текущего пользователя
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Заполняем поля данными из аккаунта, если они пустые
        if (!contactName.value) {
            contactName.value = currentUser.name || '';
        }
        if (!contactEmail.value) {
            contactEmail.value = currentUser.email || '';
        }
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Загрузка привычек
async function loadHabits() {
    const habitsList = document.getElementById('habitsList');
    if (!habitsList) return;
    
    if (!window.api) {
        console.warn('API еще не загружен');
        habitsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Загрузка...</h3>
            </div>
        `;
        // Показываем статистику при загрузке API
        loadStatistics(null);
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        habitsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Войдите в систему</h3>
                <p class="text-gray-500 mb-4">Для просмотра привычек необходимо войти в систему</p>
            </div>
        `;
        // Показываем статистику для неавторизованных пользователей
        loadStatistics(null);
        return;
    }
    
    try {
        // Получаем привычки из API
        const userHabits = await window.api.getHabits();
    
    if (userHabits.length === 0) {
        habitsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">У вас пока нет привычек</h3>
                <p class="text-gray-500 mb-4">Добавьте свою первую привычку, чтобы начать отслеживать прогресс</p>
                <button id="addFirstHabitBtn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Добавить первую привычку</button>
            </div>
        `;
        
        document.getElementById('addFirstHabitBtn').addEventListener('click', function() {
            document.getElementById('addHabitModal').classList.remove('hidden');
        });
        
            // Показываем статистику для пользователей без привычек
            loadStatistics([]);
        return;
    }
    
    // Отображаем привычки
    habitsList.innerHTML = userHabits.map(habit => `
        <div class="bg-white rounded-lg overflow-hidden shadow habit-card">
            <div class="h-40 ${getHabitCategoryColor(habit.category)} flex items-center justify-center">
                <span class="text-4xl">${getHabitIcon(habit.category)}</span>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${habit.name}</h3>
                <p class="text-gray-600 text-sm mb-4">${habit.description || 'Описание отсутствует'}</p>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm text-gray-500">${getHabitFrequencyText(habit.frequency)}</span>
                    <span class="text-sm font-semibold ${getProgressColor(habit.progress)}">${habit.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div class="h-2.5 rounded-full ${getProgressBarColor(habit.progress)}" style="width: ${habit.progress}%"></div>
                </div>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 mark-completed" data-habit-id="${habit.id}">Выполнено</button>
                    <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 view-details" data-habit-id="${habit.id}">Подробнее</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок "Выполнено"
    document.querySelectorAll('.mark-completed').forEach(button => {
        button.addEventListener('click', function() {
            const habitId = parseInt(this.getAttribute('data-habit-id'));
            markHabitAsCompleted(habitId);
        });
    });
    
    // Добавляем обработчики для кнопок "Подробнее"
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const habitId = parseInt(this.getAttribute('data-habit-id'));
            viewHabitDetails(habitId);
        });
    });
        
        // Загружаем и отображаем статистику
        loadStatistics(userHabits);
    } catch (error) {
        console.error('Ошибка при загрузке привычек:', error);
        habitsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <h3 class="text-xl font-semibold text-red-600 mb-2">Ошибка загрузки</h3>
                <p class="text-gray-500 mb-4">${error.message || 'Не удалось загрузить привычки'}</p>
            </div>
        `;
        // Показываем статистику при ошибке
        loadStatistics(null);
    }
}

// Загрузка и отображение статистики
function loadStatistics(habits) {
    const statisticsSection = document.getElementById('statisticsSection');
    const habitsProgressList = document.getElementById('habitsProgressList');
    
    if (!statisticsSection || !habitsProgressList) {
        return; // Если мы не на странице со статистикой
    }
    
    // Всегда показываем секцию статистики
    statisticsSection.classList.remove('hidden');
    
    // Если пользователь не авторизован
    if (habits === null) {
        habitsProgressList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 mb-4">Для просмотра статистики необходимо войти в систему</p>
                <button id="loginForStatsBtn" class="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">Войти</button>
            </div>
        `;
        
        // Добавляем обработчик для кнопки входа
        const loginBtn = document.getElementById('loginForStatsBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.classList.remove('hidden');
                }
            });
        }
        
        // Обнуляем круговой график
        updateOverallProgress(0);
        return;
    }
    
    // Если нет привычек
    if (!habits || habits.length === 0) {
        habitsProgressList.innerHTML = `
            <div class="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p class="text-gray-500 mb-4">У вас пока нет привычек для отображения статистики</p>
                <p class="text-gray-400 text-sm">Добавьте привычки и начните отслеживать свой прогресс!</p>
            </div>
        `;
        
        // Обнуляем круговой график
        updateOverallProgress(0);
        return;
    }
    
    // Рассчитываем количество выполненных дней за последние 7 дней для каждой привычки
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let totalProgress = 0;
    let habitsWithProgress = [];
    
    habits.forEach(habit => {
        const completedDates = habit.completedDates || [];
        const recentCompletions = completedDates.filter(date => {
            const completionDate = new Date(date);
            return completionDate >= sevenDaysAgo;
        });
        
        const daysCompleted = recentCompletions.length;
        const progress = habit.progress || 0;
        
        habitsWithProgress.push({
            name: habit.name,
            daysCompleted: daysCompleted,
            progress: progress
        });
        
        totalProgress += progress;
    });
    
    // Рассчитываем общий прогресс (среднее значение)
    const overallProgress = habits.length > 0 ? Math.round(totalProgress / habits.length) : 0;
    
    // Отображаем прогресс для каждой привычки
    habitsProgressList.innerHTML = habitsWithProgress.map(habit => {
        const progressColor = habit.progress >= 80 ? 'bg-green-600' : 
                             habit.progress >= 50 ? 'bg-yellow-500' : 
                             'bg-red-500';
        
        return `
            <div>
                <div class="flex justify-between mb-1">
                    <span>${habit.name}</span>
                    <span>${habit.daysCompleted}/7 дней</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="${progressColor} h-2.5 rounded-full transition-all duration-300" style="width: ${habit.progress}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    // Обновляем общий прогресс (круговой график)
    updateOverallProgress(overallProgress);
}

// Функция для обновления кругового графика общего прогресса
function updateOverallProgress(progress) {
    const overallProgressPath = document.getElementById('overallProgressPath');
    const overallProgressText = document.getElementById('overallProgressText');
    
    if (overallProgressPath && overallProgressText) {
        const strokeColor = progress >= 80 ? '#10b981' : 
                           progress >= 50 ? '#eab308' : 
                           '#ef4444';
        
        // Используем stroke-dasharray для отображения прогресса
        // Формат: "длина_заливки, общая_длина"
        overallProgressPath.setAttribute('stroke-dasharray', `${progress}, 100`);
        overallProgressPath.setAttribute('stroke', strokeColor);
        overallProgressText.textContent = `${progress}%`;
    }
}

// Добавление новой привычки
async function addNewHabit() {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    const name = document.getElementById('habitName').value;
    const description = document.getElementById('habitDescription').value;
    const category = document.getElementById('habitCategory').value;
    const frequency = document.getElementById('habitFrequency').value;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showNotification('Для добавления привычки необходимо войти в систему', 'info');
        return;
    }
    
    try {
        await window.api.createHabit({
        name,
        description,
        category,
            frequency
        });
    
    // Закрываем модальное окно
    document.getElementById('addHabitModal').classList.add('hidden');
    
    // Очищаем форму
    document.getElementById('addHabitForm').reset();
    
    // Перезагружаем список привычек
        await loadHabits();
    
    // Показываем уведомление
    showNotification('Привычка успешно добавлена!', 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка при добавлении привычки', 'error');
    }
}

// Отметить привычку как выполненную
async function markHabitAsCompleted(habitId) {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    try {
        await window.api.markHabitComplete(habitId);
        
        // Перезагружаем список привычек (это также обновит статистику)
        await loadHabits();
        
        // Показываем уведомление
        showNotification('Привычка отмечена как выполненная!', 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка при отметке привычки', 'error');
    }
}

// Просмотр деталей привычки
async function viewHabitDetails(habitId) {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    try {
        const habits = await window.api.getHabits();
        const habit = habits.find(h => h.id === parseInt(habitId));
    
        if (!habit) {
            showNotification('Привычка не найдена', 'error');
            return;
        }
    
    // В реальном приложении здесь был бы переход на страницу с деталями привычки
    // Для демонстрации покажем модальное окно с информацией
    const modalContent = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 class="text-2xl font-bold mb-4">${habit.name}</h3>
                <p class="text-gray-600 mb-4">${habit.description || 'Описание отсутствует'}</p>
                <div class="mb-4">
                    <span class="font-semibold">Категория:</span> ${getHabitCategoryText(habit.category)}
                </div>
                <div class="mb-4">
                    <span class="font-semibold">Частота:</span> ${getHabitFrequencyText(habit.frequency)}
                </div>
                <div class="mb-4">
                    <span class="font-semibold">Прогресс:</span> ${habit.progress}%
                </div>
                <div class="mb-6">
                    <span class="font-semibold">Создана:</span> ${new Date(habit.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <div class="flex space-x-2">
                    <button id="closeHabitDetails" class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">Закрыть</button>
                    <button id="deleteHabitBtn" class="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600">Удалить</button>
                </div>
            </div>
        </div>
    `;
    
    // Создаем и добавляем модальное окно
    const modal = document.createElement('div');
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Добавляем обработчик для кнопки закрытия
    document.getElementById('closeHabitDetails').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Добавляем обработчик для кнопки удаления
        document.getElementById('deleteHabitBtn').addEventListener('click', async function() {
            await deleteHabit(habitId);
        document.body.removeChild(modal);
    });
    
    // Закрытие при клике вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    } catch (error) {
        console.error('Ошибка при просмотре деталей привычки:', error);
        showNotification(error.message || 'Ошибка при загрузке деталей привычки', 'error');
    }
}

// Удаление привычки
async function deleteHabit(habitId) {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    try {
        // Получаем привычку для отображения названия в уведомлении
        const habits = await window.api.getHabits();
        const habit = habits.find(h => h.id === parseInt(habitId));
        const habitName = habit ? habit.name : 'Привычка';
        
        await window.api.deleteHabit(habitId);
    
    // Перезагружаем список привычек
        await loadHabits();
    
    // Показываем уведомление об успешном удалении
    showNotification(`Привычка "${habitName}" успешно удалена!`, 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка при удалении привычки', 'error');
    }
}

// Инициализация кнопок добавления привычек на главной странице
function initHomePageHabits() {
    const addHabitButtons = document.querySelectorAll('.add-habit-btn');
    
    addHabitButtons.forEach(button => {
        // Удаляем старые обработчики, клонируя кнопку
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Добавляем новый обработчик
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const habitData = {
                name: this.getAttribute('data-name'),
                description: this.getAttribute('data-description'),
                category: this.getAttribute('data-category'),
                frequency: 'daily'
            };
            addPopularHabit(habitData);
        });
    });
}

// Функция для добавления популярной привычки
async function addPopularHabit(habitData) {
    if (!window.api) {
        showNotification('API еще не загружен, попробуйте обновить страницу', 'error');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showNotification('Для добавления привычки необходимо войти в систему', 'info');
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.classList.remove('hidden');
        }
        return;
    }
    
    try {
    // Проверяем, нет ли уже такой привычки у пользователя
        const habits = await window.api.getHabits();
        const existingHabit = habits.find(h => h.name === habitData.name);
    
    if (existingHabit) {
        showNotification('Эта привычка уже добавлена в ваш список!', 'info');
        return;
    }
    
        // Создаем новую привычку через API
        await window.api.createHabit({
        name: habitData.name,
        description: habitData.description,
        category: habitData.category,
            frequency: habitData.frequency || 'daily'
        });
    
    // Показываем уведомление
    showNotification(`Привычка "${habitData.name}" успешно добавлена!`, 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка при добавлении привычки', 'error');
    }
}

// Вспомогательные функции для привычек определены в habit.js
// Используем их оттуда, чтобы избежать дублирования кода
