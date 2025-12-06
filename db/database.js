// Работа с базой данных (эмуляция SQLite через localStorage)

// Инициализация базы данных
function initDatabase() {
    // Инициализация пользователей
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: 'admin001',
                name: 'Администратор',
                email: 'admin@qualityguard.ru',
                password: btoa('admin123'), // В реальном приложении используйте хеширование
                role: 'admin',
                registrationDate: new Date('2023-01-01').toISOString(),
                applications: []
            },
            {
                id: 'user001',
                name: 'Иван Петров',
                email: 'ivan@example.com',
                password: btoa('password123'),
                role: 'user',
                registrationDate: new Date('2023-05-15').toISOString(),
                applications: ['app001', 'app002']
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    // Инициализация заявок
    if (!localStorage.getItem('applications')) {
        const defaultApplications = [
            {
                id: 'app001',
                userId: 'user001',
                name: 'Иван Петров',
                email: 'ivan@example.com',
                phone: '+7 (999) 123-45-67',
                service: 'testing',
                message: 'Нужно протестировать мобильное приложение для iOS и Android',
                date: new Date('2023-06-10').toISOString(),
                status: 'completed'
            },
            {
                id: 'app002',
                userId: 'user001',
                name: 'Иван Петров',
                email: 'ivan@example.com',
                phone: '+7 (999) 123-45-67',
                service: 'automation',
                message: 'Требуется автоматизация тестирования веб-приложения на React',
                date: new Date('2023-07-20').toISOString(),
                status: 'processing'
            },
            {
                id: 'app003',
                userId: null,
                name: 'Мария Сидорова',
                email: 'maria@example.com',
                phone: '+7 (916) 765-43-21',
                service: 'security',
                message: 'Необходим аудит безопасности банковского приложения',
                date: new Date('2023-08-05').toISOString(),
                status: 'new'
            }
        ];
        localStorage.setItem('applications', JSON.stringify(defaultApplications));
    }
}

// Получение всех пользователей
function getUsers() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
}

// Получение пользователя по ID
function getUserById(userId) {
    const users = getUsers();
    return users.find(user => user.id === userId);
}

// Обновление пользователя
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(user => user.id === userId);
    
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }
    
    return false;
}

// Получение всех заявок
function getApplications() {
    const appsJson = localStorage.getItem('applications');
    return appsJson ? JSON.parse(appsJson) : [];
}

// Получение заявок пользователя
function getUserApplications(userId) {
    const applications = getApplications();
    return applications.filter(app => app.userId === userId);
}

// Сохранение новой заявки
function saveApplication(application) {
    const applications = getApplications();
    applications.push(application);
    localStorage.setItem('applications', JSON.stringify(applications));
    
    // Обновление списка заявок пользователя
    if (application.userId) {
        const user = getUserById(application.userId);
        if (user) {
            user.applications.push(application.id);
            updateUser(application.userId, { applications: user.applications });
        }
    }
    
    return application.id;
}

// Обновление статуса заявки
function updateApplicationStatus(applicationId, newStatus) {
    const applications = getApplications();
    const index = applications.findIndex(app => app.id === applicationId);
    
    if (index !== -1) {
        applications[index].status = newStatus;
        applications[index].updatedAt = new Date().toISOString();
        localStorage.setItem('applications', JSON.stringify(applications));
        return true;
    }
    
    return false;
}

// Удаление заявки
function deleteApplication(applicationId) {
    const applications = getApplications();
    const filteredApplications = applications.filter(app => app.id !== applicationId);
    localStorage.setItem('applications', JSON.stringify(filteredApplications));
    return true;
}

// Получение статистики
function getStatistics() {
    const applications = getApplications();
    const users = getUsers();
    
    return {
        totalApplications: applications.length,
        totalUsers: users.length,
        newApplications: applications.filter(app => app.status === 'new').length,
        completedApplications: applications.filter(app => app.status === 'completed').length,
        applicationsByService: applications.reduce((acc, app) => {
            acc[app.service] = (acc[app.service] || 0) + 1;
            return acc;
        }, {}),
        applicationsByMonth: applications.reduce((acc, app) => {
            const month = new Date(app.date).getMonth();
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {})
    };
}

// Поиск заявок
function searchApplications(query) {
    const applications = getApplications();
    const lowerQuery = query.toLowerCase();
    
    return applications.filter(app => 
        app.name.toLowerCase().includes(lowerQuery) ||
        app.email.toLowerCase().includes(lowerQuery) ||
        app.message.toLowerCase().includes(lowerQuery) ||
        app.service.toLowerCase().includes(lowerQuery)
    );
}

// Экспорт функций
window.initDatabase = initDatabase;
window.getApplications = getApplications;
window.getUserApplications = getUserApplications;
window.saveApplication = saveApplication;
window.updateApplicationStatus = updateApplicationStatus;
window.deleteApplication = deleteApplication;
window.getStatistics = getStatistics;
window.searchApplications = searchApplications;

// Инициализация базы данных при загрузке
document.addEventListener('DOMContentLoaded', initDatabase);