// admin-core.js - Funciones compartidas para el panel de administración
console.log('✅ Admin Core cargado');

// Función para formatear fechas
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Función para mostrar mensajes
function showMessage(message, type = 'info') {
    const colors = {
        success: '#34a853',
        error: '#ea4335',
        info: '#4285f4',
        warning: '#f9ab00'
    };
    
    console.log(`📢 [${type}] ${message}`);
    
    // Intentar mostrar en la interfaz si existe un contenedor
    const messageContainer = document.getElementById('globalMessage');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.style.backgroundColor = colors[type] + '20';
        messageContainer.style.color = colors[type];
        messageContainer.style.border = `2px solid ${colors[type]}`;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }
}

// Función para enviar mensaje al padre (dashboard)
function notifyParent(type, data = {}) {
    if (window.parent) {
        window.parent.postMessage({
            type: type,
            ...data
        }, '*');
    }
}

// Función para cambiar de página desde el iframe
function changePage(page) {
    notifyParent('CHANGE_PAGE', { page: page });
}

// Exportar funciones globalmente
window.adminCore = {
    formatDate,
    showMessage,
    notifyParent,
    changePage
};