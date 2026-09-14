/**
 * SENREPORTS.JS
 * Maneja la ventana emergente de reportar errores
 * Se abre desde index.html (u otras páginas) mediante window.open()
 */

console.log('📝 sendreports.js cargado');

class SendReportsManager {
    constructor() {
        this.user = null;
        this.browserLogger = window.browserLogger || null;
        this.init();
    }

    init() {
        console.log('🚀 Inicializando SendReportsManager...');
        
        // Obtener usuario desde localStorage (viene de la ventana padre)
        this.loadUserFromStorage();
        
        // Configurar la UI
        this.setupUI();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('✅ SendReportsManager inicializado');
    }

    loadUserFromStorage() {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                this.user = JSON.parse(userStr);
                console.log('👤 Usuario cargado:', this.user.apellidoNombre);
                
                // Llenar campos ocultos
                const userIdInput = document.getElementById('reportUserId');
                const userEmailInput = document.getElementById('reportUserEmail');
                
                if (userIdInput) userIdInput.value = this.user._id || '';
                if (userEmailInput) userEmailInput.value = this.user.email || '';
            } else {
                console.warn('⚠️ No hay usuario en localStorage');
            }
        } catch (error) {
            console.error('❌ Error cargando usuario:', error);
        }
    }

    setupUI() {
        // Mostrar URL actual
        const urlElement = document.getElementById('currentUrl');
        if (urlElement) {
            urlElement.textContent = window.location.href;
        }

        // Mostrar User Agent
        const uaElement = document.getElementById('currentUserAgent');
        if (uaElement) {
            const ua = navigator.userAgent;
            uaElement.textContent = ua.length > 60 ? ua.substring(0, 60) + '...' : ua;
        }

        // Mostrar cantidad de logs disponibles
        const logsCountElement = document.getElementById('logsCount');
        if (logsCountElement && this.browserLogger) {
            const logs = this.browserLogger.getCurrentLogs?.() || [];
            logsCountElement.textContent = `${logs.length} logs disponibles`;
        }

        // Contador de caracteres para descripción
        const descriptionTextarea = document.getElementById('reportDescription');
        const descriptionCounter = document.getElementById('descriptionCounter');
        
        if (descriptionTextarea && descriptionCounter) {
            descriptionTextarea.addEventListener('input', () => {
                descriptionCounter.textContent = descriptionTextarea.value.length;
            });
        }
    }

    setupEventListeners() {
        const form = document.getElementById('sendreportForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReport();
            });
        }

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.close();
            }
        });
    }

    async submitReport() {
        const title = document.getElementById('reportTitle')?.value.trim();
        const description = document.getElementById('reportDescription')?.value.trim();
        const steps = document.getElementById('reportSteps')?.value.trim() || null;

        // Validaciones
        if (!title || !description) {
            this.showMessage('❌ Título y descripción son obligatorios', 'error');
            return;
        }

        if (!this.user || !this.user._id) {
            this.showMessage('❌ No se pudo identificar al usuario. Por favor, iniciá sesión nuevamente.', 'error');
            return;
        }

        // Obtener logs del navegador (SIEMPRE se incluyen)
        let logs = [];
        if (this.browserLogger && typeof this.browserLogger.getCurrentLogs === 'function') {
            try {
                logs = this.browserLogger.getCurrentLogs();
                console.log(`📊 ${logs.length} logs obtenidos para incluir en el reporte`);
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener logs:', e.message);
            }
        }

        // Deshabilitar botón mientras se envía
        const submitBtn = document.getElementById('sendreportSubmitBtn');
        const originalText = submitBtn?.textContent || '📤 Enviar reporte';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Enviando...';
        }

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': this.user._id
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    steps: steps,
                    logs: logs,
                    includeLogs: true, // ✅ SIEMPRE incluir logs
                    url: window.location.href,
                    userAgent: navigator.userAgent
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('✅ Reporte enviado correctamente. ¡Gracias por ayudarnos a mejorar!', 'success');
                
                // Cerrar ventana después de 2 segundos
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                throw new Error(result.message || 'Error al enviar el reporte');
            }

        } catch (error) {
            console.error('❌ Error enviando reporte:', error);
            this.showMessage('❌ Error al enviar el reporte: ' + error.message, 'error');
            
            // Rehabilitar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    showMessage(message, type) {
        const msgDiv = document.getElementById('sendreportsMensaje');
        if (!msgDiv) return;

        msgDiv.textContent = message;
        msgDiv.className = `sendreports-mensaje ${type}`;
        msgDiv.style.display = 'block';

        // Scroll al mensaje
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-ocultar mensajes de error después de 5 segundos
        if (type === 'error') {
            setTimeout(() => {
                msgDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sendReportsManager = new SendReportsManager();
});