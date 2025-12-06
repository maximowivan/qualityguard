// Основные функции сайта

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileMenu();
    initAuthState();
    checkAdminAccess();
    
    // Открываем модальное окно контактов если пришли со ссылкой
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openContact') === 'true') {
        // Используем небольшую задержку для гарантии, что DOM полностью загружен
        setTimeout(() => {
            const modal = document.getElementById('contact-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }, 100);
        // Очищаем параметр из URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Навигация между страницами
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
    const currentPage = window.location.pathname.split('/').pop();
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Мобильное меню
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }
}

// Проверка состояния авторизации
function initAuthState() {
    const user = getCurrentUser();
    const authButtons = document.querySelectorAll('[onclick*="openAuthModal"]');
    
    if (user) {
        // Показываем кнопку профиля вместо кнопок входа/регистрации
        authButtons.forEach(btn => {
            btn.parentElement.innerHTML = `
                <button onclick="openProfileModal()" 
                        class="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.name}</span>
                </button>
            `;
        });
    }
}

// Открытие модального окна контактов
function openContactModal() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Если мы не на главной странице, перенаправляем на неё
    if (currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'index.html?openContact=true';
        return;
    }
    
    const user = getCurrentUser();
    const modal = document.getElementById('contact-modal');
    
    if (modal) {
        if (user) {
            // Автозаполнение данных пользователя
            const nameInput = document.getElementById('contact-name');
            const emailInput = document.getElementById('contact-email');
            if (nameInput) nameInput.value = user.name;
            if (emailInput) emailInput.value = user.email;
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('modal-enter');
    }
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    modal.classList.add('hidden');
}

// Отправка контактной формы
function submitFullContact() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const phone = document.getElementById('contact-phone').value;
    const service = document.getElementById('contact-service').value;
    const message = document.getElementById('contact-message').value;
    
    if (!name || !email || !message) {
        showNotification('Пожалуйста, заполните обязательные поля', 'error');
        return;
    }
    
    // Сохранение заявки в базу данных
    const application = {
        id: Date.now(),
        userId: getCurrentUser()?.id || null,
        name: name,
        email: email,
        phone: phone,
        service: service,
        message: message,
        date: new Date().toISOString(),
        status: 'new'
    };
    
    saveApplication(application);
    
    // Очистка формы
    document.getElementById('full-contact-form').reset();
    closeContactModal();
    
    showNotification('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
}

// Упрощенная форма контактов
function submitContact() {
    const form = document.getElementById('contact-form');
    const inputs = form.querySelectorAll('input, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            isValid = false;
            input.classList.add('border-red-500');
        } else {
            input.classList.remove('border-red-500');
        }
    });
    
    if (!isValid) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    showNotification('Спасибо! Мы скоро с вами свяжемся.', 'success');
    form.reset();
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Удаляем предыдущие уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notif => notif.remove());
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Проверка доступа к админке
function checkAdminAccess() {
    const adminLink = document.getElementById('admin-link');
    const user = getCurrentUser();
    
    if (adminLink && (!user || user.email !== 'admin@qualityguard.ru')) {
        adminLink.style.display = 'none';
    }
}

// Получение текущего пользователя
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Заказ конкретной услуги
function orderService(serviceName, price) {
    const user = getCurrentUser();
    const modal = document.getElementById('contact-modal');
    
    // Автозаполнение формы
    document.getElementById('contact-service').value = getServiceCode(serviceName);
    
    if (user) {
        document.getElementById('contact-name').value = user.name;
        document.getElementById('contact-email').value = user.email;
    }
    
    // Добавляем информацию об услуге в сообщение
    const messageField = document.getElementById('contact-message');
    messageField.value = `Интересует услуга: ${serviceName} (${price})\n\nОпишите ваш проект:`;
    
    // Прокручиваем к полю сообщения
    messageField.focus();
    messageField.setSelectionRange(0, 0);
    
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

// Получение кода услуги по названию
function getServiceCode(serviceName) {
    const services = {
        'Тестирование ПО': 'testing',
        'Автоматизация QA': 'automation', 
        'Аудит безопасности': 'security',
        'Консалтинг': 'consulting',
        'Стандарт': 'testing',
        'Профессиональный': 'automation',
        'Премиум': 'security'
    };
    return services[serviceName] || '';
}

// Открытие модального окна авторизации
function openAuthModal(mode) {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-title');
    const button = document.getElementById('auth-button');
    const switchBtn = document.getElementById('switch-auth');
    const registerFields = document.getElementById('register-fields');
    
    if (mode === 'login') {
        title.textContent = 'Вход';
        button.textContent = 'Войти';
        switchBtn.textContent = 'Создать новый аккаунт';
        registerFields.classList.add('hidden');
    } else {
        title.textContent = 'Регистрация';
        button.textContent = 'Зарегистрироваться';
        switchBtn.textContent = 'Уже есть аккаунт? Войти';
        registerFields.classList.remove('hidden');
    }
    
    modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
    document.getElementById('auth-form').reset();
}

function switchAuthMode() {
    const title = document.getElementById('auth-title');
    if (title.textContent === 'Вход') {
        openAuthModal('register');
    } else {
        openAuthModal('login');
    }
}

function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const user = getCurrentUser();
    
    if (user && modal) {
        const profileContent = document.getElementById('profile-content');
        profileContent.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                    <p class="p-4 bg-gray-50 rounded-lg">${user.name}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p class="p-4 bg-gray-50 rounded-lg">${user.email}</p>
                </div>
                <button onclick="logout()" class="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Выход
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('hidden');
}

function logout() {
    localStorage.removeItem('currentUser');
    closeProfileModal();
    location.reload();
}

// Экспорт функций для использования в других файлах
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.submitContact = submitContact;
window.showNotification = showNotification;
window.getCurrentUser = getCurrentUser;
window.formatDate = formatDate;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthMode = switchAuthMode;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.logout = logout;