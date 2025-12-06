// Административные функции

let currentPage = 1;
const itemsPerPage = 10;
let filteredApplications = [];

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
    if (isAdmin()) {
        loadAdminData();
        initEventListeners();
    }
});

// Проверка прав администратора
function checkAdminAccess() {
    const user = getCurrentUser();
    const adminPanel = document.getElementById('admin-panel');
    const adminCheck = document.getElementById('admin-check');
    
    if (!user || user.email !== 'admin@qualityguard.ru') {
        if (adminPanel) adminPanel.style.display = 'none';
        if (adminCheck) adminCheck.classList.remove('hidden');
    } else {
        if (adminPanel) adminPanel.style.display = 'block';
        if (adminCheck) adminCheck.classList.add('hidden');
    }
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.email === 'admin@qualityguard.ru';
}

// Инициализация обработчиков событий
function initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const serviceFilter = document.getElementById('service-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterApplications();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterApplications();
        });
    }
    
    if (serviceFilter) {
        serviceFilter.addEventListener('change', function() {
            filterApplications();
        });
    }
}

// Загрузка данных для админ-панели
function loadAdminData() {
    updateStatistics();
    loadApplications();
    loadUsers();
    updateCharts();
}

// Обновление статистики
function updateStatistics() {
    const statistics = getStatistics();
    const users = getUsers();
    
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-applications').textContent = statistics.totalApplications;
    document.getElementById('new-applications').textContent = statistics.newApplications;
    
    if (statistics.totalApplications > 0 && users.length > 0) {
        const conversionRate = Math.round((statistics.completedApplications / statistics.totalApplications) * 100);
        document.getElementById('conversion-rate').textContent = conversionRate + '%';
    }
}

// Загрузка заявок
function loadApplications() {
    const applications = getApplications();
    filteredApplications = [...applications].sort((a, b) => new Date(b.date) - new Date(a.date));
    renderApplicationsTable();
}

// Фильтрация заявок
function filterApplications() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const serviceFilter = document.getElementById('service-filter').value;
    
    let applications = getApplications();
    
    // Применяем фильтры
    applications = applications.filter(app => {
        const matchesSearch = !searchTerm || 
            app.name.toLowerCase().includes(searchTerm) ||
            app.email.toLowerCase().includes(searchTerm) ||
            app.message.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || app.status === statusFilter;
        const matchesService = !serviceFilter || app.service === serviceFilter;
        
        return matchesSearch && matchesStatus && matchesService;
    });
    
    filteredApplications = applications.sort((a, b) => new Date(b.date) - new Date(a.date));
    currentPage = 1;
    renderApplicationsTable();
}

// Очистка фильтров
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('service-filter').value = '';
    filterApplications();
}

// Обновление данных
function refreshData() {
    loadAdminData();
    showNotification('Данные обновлены', 'success');
}

// Отображение таблицы заявок
function renderApplicationsTable() {
    const tableBody = document.getElementById('applications-table');
    const totalCount = document.getElementById('total-count');
    const shownCount = document.getElementById('shown-count');
    const currentPageElement = document.getElementById('current-page');
    
    if (!tableBody) return;
    
    // Пагинация
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    paginatedApplications.forEach(application => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="font-mono text-sm">${application.id.substring(0, 8)}...</td>
            <td>${application.name}</td>
            <td>${application.email}</td>
            <td>${getServiceName(application.service)}</td>
            <td>${formatDate(application.date)}</td>
            <td>
                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}">
                    ${getStatusText(application.status)}
                </span>
            </td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="viewApplicationDetails('${application.id}')" 
                            class="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="changeApplicationStatus('${application.id}')" 
                            class="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteApplicationAdmin('${application.id}')" 
                            class="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Обновление информации о пагинации
    totalCount.textContent = filteredApplications.length;
    shownCount.textContent = paginatedApplications.length;
    currentPageElement.textContent = currentPage;
}

// Изменение страницы
function changePage(direction) {
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderApplicationsTable();
    }
}

// Просмотр деталей заявки
function viewApplicationDetails(applicationId) {
    const applications = getApplications();
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    const modal = document.getElementById('application-details');
    const content = document.getElementById('application-details-content');
    
    const user = application.userId ? getUserById(application.userId) : null;
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-bold text-gray-500 mb-2">Основная информация</h4>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-gray-500">ID заявки</p>
                            <p class="font-mono">${application.id}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Дата создания</p>
                            <p>${formatDate(application.date)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Статус</p>
                            <span class="px-3 py-1 rounded-full ${getStatusColor(application.status)}">
                                ${getStatusText(application.status)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-gray-500 mb-2">Контактная информация</h4>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-gray-500">Имя</p>
                            <p>${application.name}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Email</p>
                            <p>${application.email}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Телефон</p>
                            <p>${application.phone || 'Не указан'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="font-bold text-gray-500 mb-2">Информация о заявке</h4>
                <div class="space-y-3">
                    <div>
                        <p class="text-sm text-gray-500">Услуга</p>
                        <p>${getServiceName(application.service)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Сообщение</p>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="whitespace-pre-line">${application.message}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            ${user ? `
            <div>
                <h4 class="font-bold text-gray-500 mb-2">Информация о пользователе</h4>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">ID пользователя</p>
                            <p class="font-mono">${user.id}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Дата регистрации</p>
                            <p>${formatDate(user.registrationDate)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Всего заявок</p>
                            <p>${user.applications ? user.applications.length : 0}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Роль</p>
                            <p>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="border-t pt-6">
                <h4 class="font-bold text-gray-500 mb-4">Действия</h4>
                <div class="flex flex-wrap gap-4">
                    <button onclick="changeApplicationStatus('${application.id}')" 
                            class="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                        <i class="fas fa-edit mr-2"></i>Изменить статус
                    </button>
                    <button onclick="deleteApplicationAdmin('${application.id}')" 
                            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        <i class="fas fa-trash mr-2"></i>Удалить заявку
                    </button>
                    <button onclick="sendEmailToClient('${application.email}')" 
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-envelope mr-2"></i>Написать клиенту
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeApplicationDetails() {
    const modal = document.getElementById('application-details');
    modal.classList.add('hidden');
}

// Изменение статуса заявки
function changeApplicationStatus(applicationId) {
    const applications = getApplications();
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    const newStatus = prompt(
        'Введите новый статус заявки:\n' +
        'new - Новая\n' +
        'processing - В обработке\n' +
        'completed - Завершена\n' +
        'cancelled - Отменена\n\n' +
        'Текущий статус: ' + getStatusText(application.status),
        application.status
    );
    
    if (newStatus && ['new', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
        if (updateApplicationStatus(applicationId, newStatus)) {
            showNotification('Статус заявки обновлен', 'success');
            loadApplications();
            updateStatistics();
            updateCharts();
        } else {
            showNotification('Ошибка при обновлении статуса', 'error');
        }
    } else if (newStatus) {
        showNotification('Некорректный статус', 'error');
    }
}

// Удаление заявки (админ)
function deleteApplicationAdmin(applicationId) {
    if (confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
        if (deleteApplication(applicationId)) {
            showNotification('Заявка удалена', 'success');
            loadApplications();
            updateStatistics();
            updateCharts();
            closeApplicationDetails();
        } else {
            showNotification('Ошибка при удалении заявки', 'error');
        }
    }
}

// Загрузка пользователей
function loadUsers() {
    const users = getUsers();
    const tableBody = document.getElementById('users-table');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const applications = getUserApplications(user.id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="font-mono text-sm">${user.id.substring(0, 8)}...</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <span class="px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                    ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </span>
            </td>
            <td>${formatDate(user.registrationDate)}</td>
            <td>${applications.length}</td>
            <td>
                <button onclick="viewUserDetails('${user.id}')" 
                        class="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Просмотр деталей пользователя
function viewUserDetails(userId) {
    const user = getUserById(userId);
    const applications = getUserApplications(userId);
    
    if (!user) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    const modal = document.getElementById('application-details');
    const content = document.getElementById('application-details-content');
    
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
            
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-bold text-gray-500 mb-2">Информация о пользователе</h4>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm text-gray-500">ID пользователя</p>
                            <p class="font-mono">${user.id}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Роль</p>
                            <span class="px-3 py-1 rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                                ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </span>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Всего заявок</p>
                            <p class="text-2xl font-bold">${applications.length}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-gray-500 mb-2">Статистика заявок</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Новые:</span>
                            <span>${applications.filter(app => app.status === 'new').length}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>В обработке:</span>
                            <span>${applications.filter(app => app.status === 'processing').length}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Завершенные:</span>
                            <span>${applications.filter(app => app.status === 'completed').length}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Отмененные:</span>
                            <span>${applications.filter(app => app.status === 'cancelled').length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${applications.length > 0 ? `
            <div>
                <h4 class="font-bold text-gray-500 mb-2">Заявки пользователя</h4>
                <div class="space-y-3 max-h-60 overflow-y-auto">
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
                            <button onclick="viewApplicationDetails('${app.id}')" 
                                    class="mt-2 text-sm text-blue-600 hover:text-blue-800">
                                Подробнее →
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="border-t pt-6">
                <div class="flex space-x-4">
                    <button onclick="sendEmailToClient('${user.email}')" 
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-envelope mr-2"></i>Написать пользователю
                    </button>
                    ${user.role !== 'admin' ? `
                    <button onclick="makeUserAdmin('${user.id}')" 
                            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        <i class="fas fa-user-shield mr-2"></i>Сделать администратором
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Назначение администратором
function makeUserAdmin(userId) {
    if (confirm('Вы уверены, что хотите назначить этого пользователя администратором?')) {
        if (updateUser(userId, { role: 'admin' })) {
            showNotification('Пользователь назначен администратором', 'success');
            loadUsers();
        } else {
            showNotification('Ошибка при назначении администратором', 'error');
        }
    }
}

// Отправка email клиенту
function sendEmailToClient(email) {
    const subject = prompt('Введите тему письма:', 'QualityGuard - ответ на вашу заявку');
    if (!subject) return;
    
    const body = prompt('Введите текст письма:');
    if (!body) return;
    
    // В реальном приложении здесь была бы отправка email через сервер
    showNotification(`Письмо отправлено на ${email}`, 'success');
    console.log(`Email to: ${email}, Subject: ${subject}, Body: ${body}`);
}

// Обновление графиков
function updateCharts() {
    const statistics = getStatistics();
    
    // Простые текстовые графики (в реальном приложении можно использовать Chart.js)
    const serviceChart = document.getElementById('service-chart');
    const statusChart = document.getElementById('status-chart');
    
    if (serviceChart) {
        const services = statistics.applicationsByService;
        let html = '<div class="w-full space-y-3">';
        
        Object.entries(services).forEach(([service, count]) => {
            const percentage = (count / statistics.totalApplications) * 100;
            html += `
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="text-sm">${getServiceName(service)}</span>
                        <span class="text-sm font-medium">${count}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        serviceChart.innerHTML = html;
    }
    
    if (statusChart) {
        const applications = getApplications();
        const statusCounts = {
            new: applications.filter(app => app.status === 'new').length,
            processing: applications.filter(app => app.status === 'processing').length,
            completed: applications.filter(app => app.status === 'completed').length,
            cancelled: applications.filter(app => app.status === 'cancelled').length
        };
        
        const colors = {
            new: 'bg-blue-500',
            processing: 'bg-yellow-500',
            completed: 'bg-green-500',
            cancelled: 'bg-red-500'
        };
        
        let html = '<div class="grid grid-cols-2 gap-4">';
        
        Object.entries(statusCounts).forEach(([status, count]) => {
            const percentage = statistics.totalApplications > 0 ? 
                Math.round((count / statistics.totalApplications) * 100) : 0;
            
            html += `
                <div class="text-center p-4 rounded-lg ${colors[status]} bg-opacity-10 border ${colors[status].replace('bg-', 'border-')}">
                    <div class="text-2xl font-bold mb-1 ${colors[status].replace('bg-', 'text-')}">${count}</div>
                    <div class="text-sm font-medium">${getStatusText(status)}</div>
                    <div class="text-xs text-gray-500">${percentage}%</div>
                </div>
            `;
        });
        
        html += '</div>';
        statusChart.innerHTML = html;
    }
}

// Экспорт данных
function exportData(type) {
    let data, filename, contentType;
    
    switch (type) {
        case 'applications':
            data = getApplications();
            filename = 'applications.csv';
            contentType = 'text/csv';
            data = convertToCSV(data, ['id', 'name', 'email', 'phone', 'service', 'message', 'date', 'status']);
            break;
            
        case 'users':
            data = getUsers();
            filename = 'users.csv';
            contentType = 'text/csv';
            data = convertToCSV(data, ['id', 'name', 'email', 'role', 'registrationDate']);
            break;
            
        case 'statistics':
            data = getStatistics();
            filename = 'statistics.json';
            contentType = 'application/json';
            data = JSON.stringify(data, null, 2);
            break;
            
        default:
            return;
    }
    
    // Создание и скачивание файла
    const blob = new Blob([data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Данные экспортированы в ${filename}`, 'success');
}

// Конвертация в CSV
function convertToCSV(data, fields) {
    const headers = fields.map(field => `"${field}"`).join(',');
    const rows = data.map(item => {
        return fields.map(field => {
            const value = item[field] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [headers, ...rows].join('\n');
}

// Экспорт функций
window.clearFilters = clearFilters;
window.refreshData = refreshData;
window.changePage = changePage;
window.viewApplicationDetails = viewApplicationDetails;
window.closeApplicationDetails = closeApplicationDetails;
window.changeApplicationStatus = changeApplicationStatus;
window.deleteApplicationAdmin = deleteApplicationAdmin;
window.viewUserDetails = viewUserDetails;
window.makeUserAdmin = makeUserAdmin;
window.sendEmailToClient = sendEmailToClient;
window.exportData = exportData;