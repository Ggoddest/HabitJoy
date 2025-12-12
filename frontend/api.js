// Файл для работы с API backend

// Определяем базовый URL API в зависимости от среды
const API_BASE_URL =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://habitjoy-production.up.railway.app/api';

// Делаем базовый URL доступным глобально
window.API_BASE_URL = API_BASE_URL;

// Получить токен из localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Сохранить токен в localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Удалить токен из localStorage
function removeToken() {
    localStorage.removeItem('token');
}

// Получить заголовки с авторизацией
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Обработка ответа от API
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
        throw new Error(error.error || `HTTP ошибка: ${response.status}`);
    }
    return response.json();
}

// ==================== API ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

// Регистрация
async function register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    });
    
    const data = await handleResponse(response);
    
    // Сохраняем токен и данные пользователя
    if (data.token) {
        setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data;
}

// Вход
async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse(response);
    
    // Сохраняем токен и данные пользователя
    if (data.token) {
        setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data;
}

// Выход
function logout() {
    removeToken();
    localStorage.removeItem('currentUser');
}

// Получить информацию о текущем пользователе
async function getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    return handleResponse(response);
}

// ==================== API ДЛЯ ПРИВЫЧЕК ====================

// Получить все привычки пользователя
async function getHabits() {
    const response = await fetch(`${API_BASE_URL}/habits`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    return handleResponse(response);
}

// Создать новую привычку
async function createHabit(habitData) {
    const response = await fetch(`${API_BASE_URL}/habits`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(habitData)
    });
    
    return handleResponse(response);
}

// Обновить привычку
async function updateHabit(habitId, habitData) {
    const response = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(habitData)
    });
    
    return handleResponse(response);
}

// Удалить привычку
async function deleteHabit(habitId) {
    const response = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    return handleResponse(response);
}

// Отметить привычку как выполненную
async function markHabitComplete(habitId) {
    const response = await fetch(`${API_BASE_URL}/habits/${habitId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    
    return handleResponse(response);
}

// Экспортируем функции для использования в других файлах
window.api = {
    register,
    login,
    logout,
    getCurrentUser,
    getHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    markHabitComplete,
    getToken,
    setToken,
    removeToken
};


