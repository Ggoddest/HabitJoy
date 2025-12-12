// Общий компонент для модальных окон входа и регистрации
// Этот файл вставляет модальные окна на все страницы, чтобы избежать дублирования

function createModals() {
    // Проверяем, не существуют ли уже модальные окна
    if (document.getElementById('loginModal') && document.getElementById('registerModal')) {
        return; // Модальные окна уже существуют
    }
    
    const modalsHTML = `
    <!-- Модальное окно входа -->
    <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md relative">
            <button id="closeLoginModal" class="absolute top-4 right-4 text-red-500 hover:text-red-700 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h3 class="text-2xl font-bold mb-6 text-center">Вход в аккаунт</h3>
            <form id="loginForm">
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2" for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 mb-2" for="loginPassword">Пароль</label>
                    <div class="relative">
                        <input type="password" id="loginPassword" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 pr-10" required>
                        <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" id="toggleLoginPassword">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <button type="submit" class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-4">Войти</button>
                <p class="text-center text-gray-600">Нет аккаунта? <button type="button" id="switchToRegister" class="text-green-500 hover:underline">Зарегистрируйтесь</button></p>
            </form>
        </div>
    </div>

    <!-- Модальное окно регистрации -->
    <div id="registerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md modal-content-register relative">
            <button id="closeRegisterModal" class="absolute top-4 right-4 text-red-500 hover:text-red-700 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h3 class="text-2xl font-bold mb-6 text-center">Регистрация</h3>
            <form id="registerForm">
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2" for="registerName">Имя</label>
                    <input type="text" id="registerName" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2" for="registerEmail">Email</label>
                    <input type="email" id="registerEmail" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500" required>
                </div>
                <div class="mb-2">
                    <label class="block text-gray-700 mb-2" for="registerPassword">Пароль</label>
                    <div class="relative">
                        <input type="password" id="registerPassword" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 pr-10" required>
                        <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" id="toggleRegisterPassword">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                    <!-- Контейнер для подсказок -->
                    <div id="passwordHelpContainer" class="mt-1"></div>
                </div>
                <button type="submit" class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-4">Зарегистрироваться</button>
                <p class="text-center text-gray-600">Уже есть аккаунт? <button type="button" id="switchToLogin" class="text-green-500 hover:underline">Войдите</button></p>
            </form>
        </div>
    </div>
    `;
    
    // Вставляем модальные окна в конец body
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    createModals();
});


