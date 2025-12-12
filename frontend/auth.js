// Файл для работы с авторизацией и регистрацией

// Проверка статуса авторизации
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Пользователь авторизован
        updateAuthUI(currentUser);
    } else {
        // Пользователь не авторизован
        updateAuthUI(null);
    }
}

// Обновление интерфейса в зависимости от статуса авторизации
function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (!loginBtn || !registerBtn) return;
    
    if (user) {
        // Пользователь авторизован
        loginBtn.textContent = user.name;
        registerBtn.textContent = 'Выйти';
        registerBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        registerBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        
        // Удаляем старые обработчики и добавляем новые
        registerBtn.replaceWith(registerBtn.cloneNode(true));
        const newRegisterBtn = document.getElementById('registerBtn');
        newRegisterBtn.addEventListener('click', handleLogout);
    } else {
        // Пользователь не авторизован
        loginBtn.textContent = 'Войти';
        registerBtn.textContent = 'Регистрация';
        registerBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        registerBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        
        // Удаляем старые обработчики и добавляем новые
        registerBtn.replaceWith(registerBtn.cloneNode(true));
        const newRegisterBtn = document.getElementById('registerBtn');
        newRegisterBtn.addEventListener('click', function() {
            document.getElementById('registerModal').classList.remove('hidden');
        });
    }
}

// Обработка выхода из системы
function handleLogout() {
    if (window.api && window.api.logout) {
        window.api.logout();
    } else {
    localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }
    location.reload();
}

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Функция для переключения видимости пароля
function initPasswordToggle() {
    console.log('Инициализация переключения пароля...');
    
    // Функция для переключения конкретного поля
    function setupPasswordToggle(passwordInputId, toggleButtonId) {
        const passwordInput = document.getElementById(passwordInputId);
        const toggleButton = document.getElementById(toggleButtonId);
        
        if (passwordInput && toggleButton) {
            console.log(`Найдены элементы: ${passwordInputId} и ${toggleButtonId}`);
            
            // Удаляем существующие обработчики (чтобы избежать дублирования)
            const newToggleButton = toggleButton.cloneNode(true);
            toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
            
            const newPasswordInput = passwordInput.cloneNode(true);
            passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);
            
            // Получаем обновленные ссылки
            const updatedPasswordInput = document.getElementById(passwordInputId);
            const updatedToggleButton = document.getElementById(toggleButtonId);
            
            updatedToggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Кнопка нажата');
                const type = updatedPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                updatedPasswordInput.setAttribute('type', type);
                
                // Меняем иконку
                const eyeIcon = this.querySelector('svg');
                if (eyeIcon) {
                    if (type === 'text') {
                        // Иконка открытого глаза
                        eyeIcon.innerHTML = `
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        `;
                    } else {
                        // Иконка закрытого глаза
                        eyeIcon.innerHTML = `
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        `;
                    }
                }
                
                // Возвращаем фокус на поле ввода
                updatedPasswordInput.focus();
            });
            
            // Добавляем стиль для курсора
            updatedToggleButton.style.cursor = 'pointer';
            
            return true;
        }
        return false;
    }
    
    // Настраиваем переключение для всех форм
    const loginSetup = setupPasswordToggle('loginPassword', 'toggleLoginPassword');
    const registerSetup = setupPasswordToggle('registerPassword', 'toggleRegisterPassword');
    
    console.log(`Настройка входа: ${loginSetup}, Настройка регистрации: ${registerSetup}`);
    
    // Если формы загружаются динамически, устанавливаем наблюдатель
    if (!loginSetup || !registerSetup) {
        console.log('Некоторые элементы не найдены, будет установлен наблюдатель');
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    setupPasswordToggle('loginPassword', 'toggleLoginPassword');
                    setupPasswordToggle('registerPassword', 'toggleRegisterPassword');
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Визуальная валидация пароля (перенесена из script.js)
function validatePasswordVisual(password) {
    const lengthReq = document.getElementById('lengthReq');
    const digitReq = document.getElementById('digitReq');
    const lowerReq = document.getElementById('lowerReq');
    const upperReq = document.getElementById('upperReq');
    const specialReq = document.getElementById('specialReq');
    
    if (!lengthReq || !digitReq || !lowerReq || !upperReq || !specialReq) return;
    
    // Проверка длины
    updateRequirement(lengthReq, password.length >= 8);
    
    // Проверка цифр
    updateRequirement(digitReq, /\d/.test(password));
    
    // Проверка строчных букв
    updateRequirement(lowerReq, /[a-z]/.test(password));
    
    // Проверка заглавных букв
    updateRequirement(upperReq, /[A-Z]/.test(password));
    
    // Проверка специальных символов
    updateRequirement(specialReq, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
}

// Валидация пароля (перенесена из script.js)
function validatePassword(password) {
    // Минимальная длина 8 символов
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Пароль должен содержать минимум 8 символов'
        };
    }
    
    // Проверка на наличие цифр
    if (!/\d/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы одну цифру'
        };
    }
    
    // Проверка на наличие строчных букв
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы одну строчную букву'
        };
    }
    
    // Проверка на наличие заглавных букв
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы одну заглавную букву'
        };
    }
    
    // Проверка на наличие специальных символов
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&*()_+-=[]{} etc.)'
        };
    }
    
    return {
        isValid: true,
        message: 'Пароль соответствует требованиям'
    };
}

// Инициализация валидации пароля
function initPasswordValidation() {
    const passwordInput = document.getElementById('registerPassword');
    
    if (passwordInput) {
        // Создаем элемент для отображения требований к паролю
        const helpContainer = document.getElementById('passwordHelpContainer');
        if (helpContainer && !document.getElementById('passwordHelp')) {
            const helpElement = document.createElement('div');
            helpElement.id = 'passwordHelp';
            helpElement.className = 'text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-3';
            helpElement.innerHTML = `
                <div class="mb-1 font-medium text-gray-700">Требования к паролю:</div>
                <div id="lengthReq" class="flex items-center text-red-500 mb-1">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span class="flex-1">Минимум 8 символов</span>
                </div>
                <div id="digitReq" class="flex items-center text-red-500 mb-1">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span class="flex-1">Хотя бы одна цифра</span>
                </div>
                <div id="lowerReq" class="flex items-center text-red-500 mb-1">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span class="flex-1">Хотя бы одна строчная буква</span>
                </div>
                <div id="upperReq" class="flex items-center text-red-500 mb-1">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span class="flex-1">Хотя бы одна заглавная буква</span>
                </div>
                <div id="specialReq" class="flex items-center text-red-500">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    <span class="flex-1">Хотя бы один специальный символ</span>
                </div>
            `;
            
            helpContainer.appendChild(helpElement);
            
            // Инициализируем подсказки (скрыты по умолчанию)
            validatePasswordVisual('');
            
            // Добавляем обработчик для реальной проверки ввода
            passwordInput.addEventListener('input', function() {
                validatePasswordVisual(this.value);
            });
            
            // Добавляем обработчик для фокуса
            passwordInput.addEventListener('focus', function() {
                helpElement.classList.add('visible');
            });
            
            // Добавляем обработчик для потери фокуса
            passwordInput.addEventListener('blur', function() {
                // Ждем немного перед скрытием
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    // Скрываем только если фокус не на подсказках и не на кнопке переключения
                    if (!helpElement.contains(activeElement) && 
                        activeElement !== passwordInput &&
                        activeElement.id !== 'toggleRegisterPassword') {
                        helpElement.classList.remove('visible');
                    }
                }, 300);
            });
            
            // Предотвращаем скрытие при клике на подсказки
            helpElement.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Обработчик для кнопки переключения видимости пароля
            const toggleBtn = document.getElementById('toggleRegisterPassword');
            if (toggleBtn) {
                toggleBtn.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
            
            console.log('Валидация пароля инициализирована');
        }
    }
}

// Вспомогательная функция для обновления отображения требований
function updateRequirement(element, condition) {
    const icon = element.querySelector('span:first-child');
    const text = element.querySelector('span:last-child');
    
    if (condition) {
        // Плавное изменение на зеленый
        requestAnimationFrame(() => {
            element.classList.remove('text-red-500');
            element.classList.add('text-green-500');
            icon.classList.remove('bg-red-500');
            icon.classList.add('bg-green-500');
            text.classList.add('font-medium');
        });
    } else {
        // Плавное изменение на красный
        requestAnimationFrame(() => {
            element.classList.remove('text-green-500');
            element.classList.add('text-red-500');
            icon.classList.remove('bg-green-500');
            icon.classList.add('bg-red-500');
            text.classList.remove('font-medium');
        });
    }
}

// Предотвращение изменения размеров модального окна
function stabilizeModalSize() {
    const registerModal = document.getElementById('registerModal');
    const modalContent = registerModal?.querySelector('.bg-white');
    
    if (modalContent) {
        // Запоминаем начальную высоту модального окна
        const initialHeight = modalContent.offsetHeight;
        
        // Устанавливаем минимальную высоту
        modalContent.style.minHeight = `${initialHeight}px`;
        
        // Наблюдаем за изменениями в подсказках пароля
        const observer = new MutationObserver(function() {
            // Принудительно сохраняем высоту
            modalContent.style.minHeight = `${initialHeight}px`;
        });
        
        // Начинаем наблюдение за контейнером подсказок
        const helpContainer = document.getElementById('passwordHelpContainer');
        if (helpContainer) {
            observer.observe(helpContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }
        
        // Очищаем при закрытии модального окна
        const closeBtn = document.getElementById('closeRegisterModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                observer.disconnect();
                modalContent.style.minHeight = '';
            });
        }
    }
}

// Инициализируем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем auth.js');
    checkAuthStatus();
    initPasswordToggle();
    initPasswordValidation();
    
    // Инициализируем стабилизацию размера модального окна
    setTimeout(stabilizeModalSize, 100);
});
