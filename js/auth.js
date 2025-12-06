// Функции авторизации и регистрации

let authMode = 'login'; // 'login' или 'register'

// Открытие модального окна авторизации
function openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-title');
    const button = document.getElementById('auth-button');
    const switchText = document.getElementById('switch-auth');
    const registerFields = document.getElementById('register-fields');
    
    authMode = mode;
    
    if (mode === 'login') {
        title.textContent = 'Вход';
        button.textContent = 'Войти';
        switchText.textContent = 'Создать новый аккаунт';
        registerFields.classList.add('hidden');
    } else {
        title.textContent = 'Регистрация';
        button.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт? Войти';
        registerFields.classList.remove('hidden');
    }
    
    // Очистка формы
    document.getElementById('auth-form').reset();
    
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
}

// Переключение между входом и регистрацией
function switchAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    openAuthModal(authMode);
}

// Обработка авторизации/регистрации
function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    if (authMode === 'register') {
        const name = document.getElementById('name').value;
        if (!name) {
            showNotification('Пожалуйста, введите имя', 'error');
            return;
        }
        
        // Регистрация
        const user = registerUser(name, email, password);
        if (user) {
            showNotification('Регистрация успешна! Добро пожаловать, ' + name, 'success');
            closeAuthModal();
            location.reload(); // Обновляем страницу для обновления интерфейса
        } else {
            showNotification('Пользователь с таким email уже существует', 'error');
        }
    } else {
        // Вход
        const user = loginUser(email, password);
        if (user) {
            showNotification('Вход выполнен успешно!', 'success');
            closeAuthModal();
            location.reload(); // Обновляем страницу для обновления интерфейса
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    }
}

// Регистрация пользователя
function registerUser(name, email, password) {
    const users = getUsers();
    
    // Проверка существования пользователя
    if (users.some(user => user.email === email)) {
        return null;
    }
    
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: hashPassword(password), // В реальном приложении используйте bcrypt
        role: 'user',
        registrationDate: new Date().toISOString(),
        applications: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return newUser;
}

// Вход пользователя
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === hashPassword(password));
    
    if (user) {
        // Не храним пароль в текущем пользователе
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return userWithoutPassword;
    }
    
    return null;
}

// Выход пользователя
function logoutUser() {
    localStorage.removeItem('currentUser');
    showNotification('Вы вышли из системы', 'info');
    location.reload();
}

// Открытие модального окна профиля
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-content');
    const user = getCurrentUser();
    
    if (!user) {
        showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    // Загрузка заявок пользователя
    const applications = getUserApplications(user.id);
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center space-x-4">
                <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600 text-3xl"></i>
                </div>
                <div>
                    <h4 class="text-xl font-bold">${user.name}</h4>
                    <p class="text-gray-600">${user.email}</p>
                    <p class="text-sm text-gray-500">Пользователь с ${formatDate(user.registrationDate)}</p>
                </div>
            </div>
            
            <div class="border-t pt-6">
                <h5 class="font-bold text-lg mb-4">Мои заявки</h5>
                ${applications.length > 0 ? 
                    `<div class="space-y-3 max-h-60 overflow-y-auto">
                        ${applications.map(app => `
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="font-medium">${getServiceName(app.service)}</span>
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(app.status)}">
                                        ${getStatusText(app.status)}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 mb-2">${app.message.substring(0, 100)}...</p>
                                <p class="text-xs text-gray-500">${formatDate(app.date)}</p>
                            </div>
                        `).join('')}
                    </div>` :
                    `<p class="text-gray-500 text-center py-4">У вас пока нет заявок</p>`
                }
            </div>
            
            <div class="border-t pt-6">
                <button onclick="logoutUser()" 
                        class="w-full py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                    <i class="fas fa-sign-out-alt mr-2"></i>Выйти
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('hidden');
}

// Вспомогательные функции
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // В реальном приложении используйте bcrypt или подобную библиотеку
    // Это упрощенная версия для демонстрации
    return btoa(password);
}

function getUsers() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
}

function getServiceName(serviceCode) {
    const services = {
        'testing': 'Тестирование ПО',
        'automation': 'Автоматизация QA',
        'security': 'Аудит безопасности',
        'consulting': 'Консалтинг',
        '': 'Не указана'
    };
    return services[serviceCode] || serviceCode;
}

function getStatusColor(status) {
    const colors = {
        'new': 'bg-blue-100 text-blue-800',
        'processing': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
    const texts = {
        'new': 'Новая',
        'processing': 'В обработке',
        'completed': 'Завершена',
        'cancelled': 'Отменена'
    };
    return texts[status] || status;
}

// Экспорт функций
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthMode = switchAuthMode;
window.handleAuth = handleAuth;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.logoutUser = logoutUser;