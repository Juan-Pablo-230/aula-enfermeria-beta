// ============================================
// clasesYT.js - VERSIÓN CORREGIDA (sin duplicados)
// ============================================

console.log('🎥 clasesYT.js - Versión CORREGIDA (sin duplicados)');

// ============================================
// CONFIGURACIÓN - ¡ÚNICO LUGAR PARA CAMBIAR!
// ============================================
const CONFIG = {
    // 🔴 CAMBIA SOLO ESTOS DOS VALORES para cada nueva clase
    VIDEO_ID: '49jVFSmAf-g',      // ID del video de YouTube
    CLASE_NOMBRE: 'Registro Informatizado y Auditoría', // Nombre visible de la clase
    
    // ⚙️ Configuración técnica (no tocar)
    DISPLAY_UPDATE_INTERVAL: 1000,
    SAVE_INTERVAL: 30000,
    UMBRAL_MINIMO: 1
};

// ============================================
// FUNCIONES DE UTILIDAD (deben estar antes de ser usadas)
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
        if (this.videoIframe) {
            const videoUrl = `https://www.youtube-nocookie.com/embed/${CONFIG.VIDEO_ID}?si=LwKpMSJkgnySkyoQ&amp;controls=0&autoplay=1`;
            this.videoIframe.src = videoUrl;
            console.log('🎬 Video configurado:', videoUrl);
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
// CLASE TimeTracker (VERSIÓN CORREGIDA - SIN DUPLICADOS)
// ============================================
class TimeTracker {
    constructor() {
        // Acumuladores de la sesión actual
        this.tiempoActivoSesion = 0;
        this.tiempoInactivoSesion = 0;
        
        // Totales acumulados
        this.tiempoActivoTotal = 0;
        this.tiempoInactivoTotal = 0;
        
        // Control de sesión
        this.sessionStartTime = Date.now();
        this.sessionActiva = true;
        
        // Control de guardado (evita duplicados)
        this.saveInProgress = false;
        this.lastSaveTime = 0;
        this.saveDebounceTimer = null;
        
        // Elementos DOM
        this.displayElement = document.getElementById('tiempoActivo');
        this.messageElement = document.getElementById('statusMessage');
        
        // Usar los valores de CONFIG
        this.claseId = `clase_${CONFIG.VIDEO_ID}`;
        this.claseNombre = CONFIG.CLASE_NOMBRE;
        
        this.init();
    }

    async init() {
        console.log('⏱️ Inicializando TimeTracker...');
        console.log(`📚 Clase: ${this.claseNombre} (${this.claseId})`);
        
        // Cargar datos guardados
        await this.cargarDatosGuardados();
        
        // Eventos
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

        // Iniciar sesión
        this.sessionStartTime = Date.now();
        this.sessionActiva = true;
        
        // Actualizar display
        setInterval(() => this.updateDisplay(), CONFIG.DISPLAY_UPDATE_INTERVAL);
        
        // Guardado periódico
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
            
            const result = await makeRequestSafe('/tiempo-clase', null, 'GET');
            
            if (result.success && result.data) {
                const registro = result.data.find(r => r.claseId === this.claseId);
                if (registro) {
                    this.tiempoActivoTotal = registro.tiempoActivo || 0;
                    this.tiempoInactivoTotal = registro.tiempoInactivo || 0;
                    console.log(`💾 Datos cargados - Activo: ${this.tiempoActivoTotal}s, Inactivo: ${this.tiempoInactivoTotal}s`);
                }
            }
        } catch (error) {
            console.log('ℹ️ No hay datos previos');
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
            tiempoActivo: this.tiempoActivoSesion,
            tiempoInactivo: this.tiempoInactivoSesion,
            esFinal: true
        };
        
        // Usar sendBeacon para garantizar el envío incluso al cerrar
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(datos)], { type: 'application/json' });
            const user = getCurrentUserSafe();
            if (user && user._id) {
                // sendBeacon no soporta headers personalizados, pero el body llega
                navigator.sendBeacon('/api/tiempo-clase/actualizar', blob);
                console.log('📤 Envío con sendBeacon para guardado final');
            }
        } else {
            // Fallback a fetch normal
            this.guardarEnMongoDB(true);
        }
    }

    async guardarEnMongoDB(esFinal = false) {
        // Evitar guardados simultáneos
        if (this.saveInProgress) {
            console.log('⏳ Guardado en progreso, omitiendo...');
            return;
        }
        
        const ahora = Date.now();
        
        // Debounce: no guardar más de una vez cada 2 segundos si no es final
        if (!esFinal && (ahora - this.lastSaveTime) < 2000 && this.tiempoActivoSesion === 0 && this.tiempoInactivoSesion === 0) {
            return;
        }
        
        // Limpiar timer anterior si existe
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }
        
        this.saveInProgress = true;
        this.lastSaveTime = ahora;
        
        if (!isLoggedInSafe()) {
            this.saveInProgress = false;
            return;
        }
        
        if (this.tiempoActivoSesion === 0 && this.tiempoInactivoSesion === 0 && !esFinal) {
            this.saveInProgress = false;
            return;
        }
        
        console.log(`📤 Guardando en MongoDB:`);
        console.log(`   + Activo: ${this.tiempoActivoSesion}s`);
        console.log(`   + Inactivo: ${this.tiempoInactivoSesion}s`);
        console.log(`   + Final: ${esFinal}`);
        
        try {
            const result = await makeRequestSafe('/tiempo-clase/actualizar', {
                claseId: this.claseId,
                claseNombre: this.claseNombre,
                tiempoActivo: this.tiempoActivoSesion,
                tiempoInactivo: this.tiempoInactivoSesion,
                esFinal: esFinal
            });
            
            if (result.success) {
                console.log('✅ Guardado OK');
                if (!esFinal) {
                    this.tiempoActivoSesion = 0;
                    this.tiempoInactivoSesion = 0;
                }
            } else {
                console.warn('⚠️ Guardado respondió con error:', result.message);
            }
        } catch (error) {
            console.error('❌ Error guardando:', error);
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
    document.getElementById('nombreUsuario').textContent = user?.apellidoNombre || 'Usuario';
    document.getElementById('legajoUsuario').textContent = user?.legajo || '-';
    document.getElementById('turnoUsuario').textContent = user?.turno || '-';
}

function actualizarTitulo() {
    const tituloPrincipal = document.getElementById('tituloPrincipal');
    if (tituloPrincipal) {
        tituloPrincipal.innerHTML = `<span class="clase-icon">🎥</span> Clase en Vivo: ${CONFIG.CLASE_NOMBRE}`;
    }
    document.title = `${CONFIG.CLASE_NOMBRE} - Clase en Vivo`;
}

async function inicializarPagina() {
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
    config: () => ({ ...CONFIG })
};