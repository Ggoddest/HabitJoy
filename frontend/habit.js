// Файл для работы с привычками
// Содержит только вспомогательные функции для отображения привычек
// Инициализация происходит в script.js через initHabitsPageFeatures()

// Вспомогательные функции для привычек
function getHabitCategoryColor(category) {
    switch(category) {
        case 'health': return 'bg-green-200';
        case 'learning': return 'bg-blue-200';
        case 'productivity': return 'bg-yellow-200';
        case 'mindfulness': return 'bg-purple-200';
        default: return 'bg-gray-200';
    }
}

function getHabitCategoryText(category) {
    switch(category) {
        case 'health': return 'Здоровье';
        case 'learning': return 'Обучение';
        case 'productivity': return 'Продуктивность';
        case 'mindfulness': return 'Осознанность';
        default: return 'Другое';
    }
}

function getHabitIcon(category) {
    switch(category) {
        case 'health': return '🏃';
        case 'learning': return '📚';
        case 'productivity': return '⏰';
        case 'mindfulness': return '🧘';
        default: return '✅';
    }
}

function getHabitFrequencyText(frequency) {
    switch(frequency) {
        case 'daily': return 'Ежедневно';
        case 'weekly': return 'Еженедельно';
        case 'monthly': return 'Ежемесячно';
        default: return 'Не указано';
    }
}

function getProgressColor(progress) {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

function getProgressBarColor(progress) {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}
