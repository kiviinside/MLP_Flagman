import React from 'react';

const Topbar = () => {
    return (
        <header className="topbar" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Панель управления</h2>
            {/* Сюда позже можно добавить поиск, уведомления или профиль */}
        </header>
    );
};

export default Topbar;