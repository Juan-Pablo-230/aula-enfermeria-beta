/**
 * SENREPORTS.JS
 * Maneja la ventana de reportar errores.
 * Se carga dentro de un iframe superpuesto por profile-updater.js
 * Se comunica con la ventana padre mediante postMessage()
 */

console.log('📝 sendreports.js cargado (modo iframe)');

class SendReportsManager {
    constructor() {
        this.user = null;
        this.browserLogger = window.browserLogger || null;
        this.isIframe = window.self !== window.top;
        this.parentOrigin = window.location.origin;
        this.init();
    }

    init() {
        console.log('🚀 Inicializando SendReportsManager...');
        console.log('📦 Modo iframe:', this.isIframe);

        this.loadUserFromStorage();
        this.setupUI();
        this.setupEventListeners();

        // Notificar al padre que estamos listos
        this.notifyParent({ type: 'REPORT_IFRAME_READY' });

        console.log('✅ SendReportsManager inicializado');
    }

    /**
     * Envía un mensaje a la ventana padre (para que cierre el modal)
     */
    notifyParent(data) {
        if (this.isIframe) {
            try {
                window.parent.postMessage(data, this.parentOrigin);
                console.log('📤 postMessage enviado al padre:', data);
            } catch (e) {
                console.warn('⚠️ No se pudo enviar postMessage:', e.message);
            }
        }
    }

    /**
     * Solicita al padre que cierre el modal
     */
    requestClose() {
        console.log('🚪 Solicitando cerrar modal al padre...');
        this.notifyParent({ type: 'CLOSE_REPORT_MODAL' });

        // Fallback: si no estamos en iframe, intentar cerrar ventana
        if (!this.isIframe) {
            window.close();
        }
    }

    loadUserFromStorage() {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                this.user = JSON.parse(userStr);
                console.log('👤 Usuario cargado:', this.user.apellidoNombre);

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
        const urlElement = document.getElementById('currentUrl');
        if (urlElement) {
            // Si estamos en iframe, mostramos la URL del padre (que es donde está el usuario)
            const urlToShow = this.isIframe && document.referrer
                ? document.referrer
                : window.location.href;
            urlElement.textContent = urlToShow;
        }

        const uaElement = document.getElementById('currentUserAgent');
        if (uaElement) {
            const ua = navigator.userAgent;
            uaElement.textContent = ua.length > 60 ? ua.substring(0, 60) + '...' : ua;
        }

        const logsCountElement = document.getElementById('logsCount');
        if (logsCountElement && this.browserLogger) {
            const logs = this.browserLogger.getCurrentLogs?.() || [];
            logsCountElement.textContent = `${logs.length} logs disponibles`;
        }

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

        // Botón X de cerrar
        const btnClose = document.getElementById('btnCloseReport');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.requestClose());
        }

        // Botón Cancelar
        const btnCancel = document.getElementById('btnCancelReport');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => this.requestClose());
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.requestClose();
            }
        });
    }

    async submitReport() {
        const title = document.getElementById('reportTitle')?.value.trim();
        const description = document.getElementById('reportDescription')?.value.trim();
        const steps = document.getElementById('reportSteps')?.value.trim() || null;

        if (!title || !description) {
            this.showMessage('❌ Título y descripción son obligatorios', 'error');
            return;
        }

        if (!this.user || !this.user._id) {
            this.showMessage('❌ No se pudo identificar al usuario. Por favor, iniciá sesión nuevamente.', 'error');
            return;
        }

        // Obtener logs del navegador
        let logs = [];
        if (this.browserLogger && typeof this.browserLogger.getCurrentLogs === 'function') {
            try {
                logs = this.browserLogger.getCurrentLogs();
                console.log(`📊 ${logs.length} logs obtenidos para incluir en el reporte`);
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener logs:', e.message);
            }
        }

        const submitBtn = document.getElementById('sendreportSubmitBtn');
        const originalText = submitBtn?.textContent || '📤 Enviar reporte';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Enviando...';
        }

        try {
            // Si estamos en iframe, usar la URL del padre para el campo "url"
            const reportUrl = this.isIframe && document.referrer
                ? document.referrer
                : window.location.href;

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
                    includeLogs: true,
                    url: reportUrl,
                    userAgent: navigator.userAgent
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('✅ Reporte enviado correctamente. ¡Gracias por ayudarnos a mejorar!', 'success');

                // Cerrar modal después de 2 segundos
                setTimeout(() => {
                    this.requestClose();
                }, 2000);
            } else {
                throw new Error(result.message || 'Error al enviar el reporte');
            }

        } catch (error) {
            console.error('❌ Error enviando reporte:', error);
            this.showMessage('❌ Error al enviar el reporte: ' + error.message, 'error');

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
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'error') {
            setTimeout(() => {
                msgDiv.style.display = 'none';
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sendReportsManager = new SendReportsManager();
});