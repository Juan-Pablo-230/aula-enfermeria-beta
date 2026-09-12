// ============================================
// clasesYT.js - VERSIÓN SIN VALORES POR DEFECTO
// Lee el videoId y nombre desde localStorage (viene del index al hacer clic en "Unirse")
// ============================================

console.log('🎥 clasesYT.js - Versión sin valores por defecto');

// ============================================
// CONFIGURACIÓN - SOLO desde localStorage
// ============================================
const CONFIG = (() => {
    const config = {
        VIDEO_ID: null,
        CLASE_NOMBRE: null,
        DISPLAY_UPDATE_INTERVAL: 1000,
        SAVE_INTERVAL: 30000,
        UMBRAL_MINIMO: 1
    };

    console.log('🔍 Leyendo configuración desde localStorage...');

    try {
        const videoIdLS = localStorage.getItem('claseYT_videoId');
        const nombreLS = localStorage.getItem('claseYT_nombre');

        console.log('📥 Valores en localStorage:', {
            videoId: videoIdLS,
            nombre: nombreLS
        });

        if (videoIdLS && videoIdLS.length === 11) {
            config.VIDEO_ID = videoIdLS;
            console.log('✅ videoId leído desde localStorage:', videoIdLS);
        } else if (videoIdLS) {
            console.warn('⚠️ videoId inválido en localStorage:', videoIdLS, '(debe tener 11 caracteres)');
        } else {
            console.warn('⚠️ No hay videoId en localStorage');
        }

        if (nombreLS) {
            config.CLASE_NOMBRE = nombreLS;
            console.log('✅ Nombre de clase leído desde localStorage:', nombreLS);
        } else {
            console.warn('⚠️ No hay nombre de clase en localStorage');
        }
    } catch (e) {
        console.error('❌ No se pudo leer desde localStorage:', e);
    }

    console.log('📋 CONFIG final:', config);
    return config;
})();

// ============================================
// VALIDACIÓN INICIAL
// ============================================
if (!CONFIG.VIDEO_ID) {
    console.error('❌ No se puede cargar la clase: falta el videoId');
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #0f1419;
                color: #e8e6e3;
                font-family: Arial, sans-serif;
                padding: 20px;
                text-align: center;
            ">
                <div style="
                    max-width: 500px;
                    padding: 40px;
                    background: #1e2328;
                    border-radius: 15px;
                    border: 2px solid #3a3f46;
                ">
                    <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
                    <h1 style="color: #ea4335; margin-bottom: 15px; font-size: 1.5em;">
                        No se pudo cargar la clase
                    </h1>
                    <p style="color: #b8b6b3; margin-bottom: 25px; line-height: 1.6;">
                        No se encontró el identificador del video.<br>
                        Por favor, ingresá desde el menú principal haciendo clic en <strong>"Unirse"</strong> a la clase.
                    </p>
                    <a href="/index.html" style="
                        display: inline-block;
                        padding: 12px 25px;
                        background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    ">← Volver al Menú Principal</a>
                </div>
            </div>
        `;
    });
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function waitForAuthSystem() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;
        const check = () => {
            if (typeof authSystem !== 'undefined' && authSystem) {
                resolve(authSystem);
            } else if (attempts++ < maxAttempts) {
                setTimeout(check, 100);
            } else {
                reject(new Error('authSystem no disponible'));
            }
        };
        check();
    });
}

function getCurrentUserSafe() {
    return authSystem?.getCurrentUser ? authSystem.getCurrentUser() : null;
}

function isLoggedInSafe() {
    return authSystem?.isLoggedIn ? authSystem.isLoggedIn() : false;
}

async function makeRequestSafe(endpoint, data = null, method = 'POST') {
    if (!authSystem || !authSystem.makeRequest) {
        throw new Error('authSystem no listo');
    }
    const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return await authSystem.makeRequest(fullEndpoint, data, method);
}

// ============================================
// CLASE VideoManager - Maneja el iframe del video
// ============================================
class VideoManager {
    constructor() {
        this.videoIframe = document.getElementById('videoIframe');
        this.init();
    }

    init() {
        if (!CONFIG.VIDEO_ID) {
            console.error('❌ VideoManager: No hay VIDEO_ID disponible');
            return;
        }

        if (this.videoIframe) {
            const videoUrl = `https://www.youtube-nocookie.com/embed/${CONFIG.VIDEO_ID}?si=LwKpMSJkgnySkyoQ&controls=0&autoplay=1`;
            this.videoIframe.src = videoUrl;
            console.log('🎬 Video configurado:', videoUrl);
            console.log('🎬 VIDEO_ID usado:', CONFIG.VIDEO_ID);
        } else {
            console.error('❌ No se encontró el iframe #videoIframe');
        }
    }
}

// ============================================
// CLASE ChatReal - Maneja el iframe del chat
// ============================================
class ChatReal {
    constructor() {
        this.chatIframe = document.getElementById('chatIframe');
        this.chatContainer = document.getElementById('chatContainer');
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        if (!CONFIG.VIDEO_ID) {
            console.error('❌ ChatReal: No hay VIDEO_ID disponible');
            return;
        }

        const domain = window.location.hostname;
        const chatUrl = `https://www.youtube.com/live_chat?v=${CONFIG.VIDEO_ID}&embed_domain=${domain}`;

        if (this.chatIframe) {
            this.chatIframe.src = chatUrl;
            console.log('💬 Chat configurado:', chatUrl);
            this.chatIframe.addEventListener('error', () => this.handleError());
        }
        setTimeout(() => this.checkStatus(), 5000);
    }

    handleError() {
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
            setTimeout(() => {
                if (this.chatIframe) {
                    this.chatIframe.src = this.chatIframe.src;
                }
            }, 2000);
        }
    }

    checkStatus() {
        try {
            if (this.chatIframe && this.chatIframe.contentDocument) {
                console.log('✅ Chat accesible');
            }
        } catch (e) {
            console.log('✅ Chat cargado');
        }
    }
}

// ============================================
// CLASE TimeTracker
// ============================================
class TimeTracker {
    constructor() {
        this.tiempoActivoSesion = 0;
        this.tiempoInactivoSesion = 0;
        this.tiempoActivoTotal = 0;
        this.tiempoInactivoTotal = 0;
        this.sessionStartTime = Date.now();
        this.sessionActiva = true;
        this.saveInProgress = false;
        this.lastSaveTime = 0;
        this.saveDebounceTimer = null;

        this.displayElement = document.getElementById('tiempoActivo');
        this.messageElement = document.getElementById('statusMessage');

        this.claseId = CONFIG.VIDEO_ID ? `clase_${CONFIG.VIDEO_ID}` : null;
        this.claseNombre = CONFIG.CLASE_NOMBRE || null;

        this.init();
    }

    async init() {
        console.log('⏱️ Inicializando TimeTracker...');

        if (!this.claseId) {
            console.warn('⚠️ TimeTracker: No hay claseId, no se registrará tiempo');
            return;
        }

        console.log(`📚 Clase: ${this.claseNombre} (${this.claseId})`);

        await this.cargarDatosGuardados();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleSalidaPestana();
            } else {
                this.handleRegresoPestana();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.handleCierrePagina();
        });

        this.sessionStartTime = Date.now();
        this.sessionActiva = true;

        setInterval(() => this.updateDisplay(), CONFIG.DISPLAY_UPDATE_INTERVAL);

        setInterval(() => {
            if (!this.saveInProgress) {
                this.guardarEnMongoDB(false);
            }
        }, CONFIG.SAVE_INTERVAL);

        console.log('✅ TimeTracker listo');
    }

    async cargarDatosGuardados() {
        try {
            if (!isLoggedInSafe()) return;

            const user = getCurrentUserSafe();
            console.log(`👤 Usuario logueado: ${user?.apellidoNombre} (${user?._id})`);

            const response = await fetch('/api/tiempo-clase', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': user._id
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📥 Respuesta de /tiempo-clase:', result);

            if (result.success && result.data) {
                const registro = result.data.find(r => r.claseId === this.claseId);
                if (registro) {
                    this.tiempoActivoTotal = registro.tiempoActivo || 0;
                    this.tiempoInactivoTotal = registro.tiempoInactivo || 0;
                    console.log(`💾 Datos cargados - Activo: ${this.tiempoActivoTotal}s, Inactivo: ${this.tiempoInactivoTotal}s`);
                } else {
                    console.log('ℹ️ No hay registros previos para esta clase');
                }
            }
        } catch (error) {
            console.error('❌ Error cargando datos guardados:', error);
        }
    }

    handleSalidaPestana() {
        if (!this.sessionActiva) return;

        console.log('👁️ Saliendo de la pestaña - Calculando tiempo activo...');

        const tiempoSesion = Math.floor((Date.now() - this.sessionStartTime) / 1000);

        if (tiempoSesion >= CONFIG.UMBRAL_MINIMO) {
            this.tiempoActivoSesion = tiempoSesion;
            this.tiempoActivoTotal += tiempoSesion;
            console.log(`⏱️ Tiempo activo: +${tiempoSesion}s (Total: ${this.tiempoActivoTotal}s)`);
            this.guardarEnMongoDB(false);
        }

        this.sessionActiva = false;
        this.sessionStartTime = Date.now();
    }

    handleRegresoPestana() {
        console.log('👁️ Volviendo a la pestaña');

        if (!this.sessionActiva && this.sessionStartTime) {
            const tiempoFuera = Math.floor((Date.now() - this.sessionStartTime) / 1000);

            if (tiempoFuera >= CONFIG.UMBRAL_MINIMO) {
                this.tiempoInactivoSesion = tiempoFuera;
                this.tiempoInactivoTotal += tiempoFuera;
                console.log(`⏱️ Tiempo inactivo: +${tiempoFuera}s (Total: ${this.tiempoInactivoTotal}s)`);
                this.guardarEnMongoDB(false);
            }
        }

        this.sessionStartTime = Date.now();
        this.sessionActiva = true;
    }

    handleCierrePagina() {
        console.log('🚪 Cerrando página - Guardando tiempos finales...');

        if (this.sessionActiva && this.sessionStartTime) {
            const tiempoSesion = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            if (tiempoSesion >= CONFIG.UMBRAL_MINIMO) {
                this.tiempoActivoTotal += tiempoSesion;
                this.tiempoActivoSesion += tiempoSesion;
                console.log(`⏱️ Último tiempo activo: +${tiempoSesion}s`);
            }
        }

        const datos = {
            claseId: this.claseId,
            claseNombre: this.claseNombre,
            tiempoActivo: this.tiempoActivoSesion || 0,
            tiempoInactivo: this.tiempoInactivoSesion || 0,
            esFinal: true
        };

        const user = getCurrentUserSafe();
        if (user && user._id) {
            fetch('/api/tiempo-clase/actualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': user._id
                },
                body: JSON.stringify(datos),
                keepalive: true
            }).catch(err => console.error('❌ Error en guardado final:', err));

            console.log('📤 Enviando guardado final:', datos);
        }
    }

    async guardarEnMongoDB(esFinal = false) {
        if (this.saveInProgress) {
            console.log('⏳ Guardado en progreso, omitiendo...');
            return;
        }

        const ahora = Date.now();

        if (!esFinal && (ahora - this.lastSaveTime) < 2000 && this.tiempoActivoSesion === 0 && this.tiempoInactivoSesion === 0) {
            return;
        }

        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        this.saveInProgress = true;
        this.lastSaveTime = ahora;

        const user = getCurrentUserSafe();
        if (!user || !user._id) {
            console.log('⚠️ Usuario no logueado, no se guarda el tiempo');
            this.saveInProgress = false;
            return;
        }

        if (this.tiempoActivoSesion === 0 && this.tiempoInactivoSesion === 0 && !esFinal) {
            this.saveInProgress = false;
            return;
        }

        const datos = {
            claseId: this.claseId,
            claseNombre: this.claseNombre,
            tiempoActivo: this.tiempoActivoSesion || 0,
            tiempoInactivo: this.tiempoInactivoSesion || 0,
            esFinal: esFinal,
            usuarioId: user._id,
            usuarioNombre: user.apellidoNombre,
            legajo: user.legajo,
            turno: user.turno,
            email: user.email
        };

        console.log(`📤 Guardando en MongoDB (${esFinal ? 'FINAL' : 'Parcial'}):`);
        console.log(`   + Usuario: ${user.apellidoNombre} (${user._id})`);
        console.log(`   + Activo: ${datos.tiempoActivo}s`);
        console.log(`   + Inactivo: ${datos.tiempoInactivo}s`);

        try {
            const result = await makeRequestSafe('/tiempo-clase/actualizar', datos);

            if (result.success) {
                console.log('✅ Guardado OK:', result.message || '');
                if (!esFinal) {
                    this.tiempoActivoSesion = 0;
                    this.tiempoInactivoSesion = 0;
                }
            } else {
                console.warn('⚠️ Guardado respondió con error:', result.message);
            }
        } catch (error) {
            console.error('❌ Error guardando en MongoDB:', error);
        } finally {
            this.saveInProgress = false;
        }
    }

    updateDisplay() {
        if (!this.displayElement) return;

        let totalActual = this.tiempoActivoTotal;

        if (this.sessionActiva && this.sessionStartTime) {
            totalActual += Math.floor((Date.now() - this.sessionStartTime) / 1000);
        }

        this.displayElement.textContent = totalActual;
    }

    getCurrentTime() {
        let total = this.tiempoActivoTotal;
        if (this.sessionActiva && this.sessionStartTime) {
            total += Math.floor((Date.now() - this.sessionStartTime) / 1000);
        }
        return total;
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================

function showLoading(message = 'Cargando...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div style="text-align: center; color: white;"><div class="loading-spinner"></div><p>${message}</p></div>`;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

function updateUserInfo() {
    if (!isLoggedInSafe()) return;
    const user = getCurrentUserSafe();
    const nombreEl = document.getElementById('nombreUsuario');
    const legajoEl = document.getElementById('legajoUsuario');
    const turnoEl = document.getElementById('turnoUsuario');

    if (nombreEl) nombreEl.textContent = user?.apellidoNombre || 'Usuario';
    if (legajoEl) legajoEl.textContent = user?.legajo || '-';
    if (turnoEl) turnoEl.textContent = user?.turno || '-';
}

function actualizarTitulo() {
    const tituloPrincipal = document.getElementById('tituloPrincipal');
    const nombre = CONFIG.CLASE_NOMBRE || 'Clase en Vivo';

    if (tituloPrincipal) {
        tituloPrincipal.innerHTML = `<span class="clase-icon">🎥</span> Clase en Vivo: ${nombre}`;
    }
    document.title = `${nombre} - Clase en Vivo`;
}

async function inicializarPagina() {
    // Si no hay VIDEO_ID, no continuar (ya se mostró el mensaje de error)
    if (!CONFIG.VIDEO_ID) {
        console.error('❌ Inicialización abortada: falta VIDEO_ID');
        return;
    }

    showLoading('Verificando acceso...');

    try {
        await waitForAuthSystem();

        if (!isLoggedInSafe()) {
            hideLoading();
            try {
                await authSystem.showLoginModal();
            } catch (error) {
                window.location.href = '/index.html';
                return;
            }
            showLoading('Cargando clase...');
        }

        actualizarTitulo();
        updateUserInfo();

        window.videoManager = new VideoManager();
        window.chatReal = new ChatReal();
        window.timeTracker = new TimeTracker();

        hideLoading();
        console.log('✅ Todo listo');
        console.log('🎬 VIDEO_ID final:', CONFIG.VIDEO_ID);
        console.log('📚 CLASE_NOMBRE final:', CONFIG.CLASE_NOMBRE);

    } catch (error) {
        console.error('❌ Error:', error);
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', inicializarPagina);

// Funciones de debug
window.debug = {
    tiempo: () => window.timeTracker?.getCurrentTime() || 0,
    totales: () => ({
        activo: window.timeTracker?.tiempoActivoTotal || 0,
        inactivo: window.timeTracker?.tiempoInactivoTotal || 0
    }),
    config: () => ({ ...CONFIG }),
    limpiarStorage: () => {
        localStorage.removeItem('claseYT_videoId');
        localStorage.removeItem('claseYT_nombre');
        console.log('🧹 localStorage limpiado');
    }
};