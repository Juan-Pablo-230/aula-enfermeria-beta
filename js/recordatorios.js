// ============================================
// SISTEMA DE RECORDATORIOS CON MÚLTIPLES TIEMPOS
// ============================================
console.log('🔔 Módulo de recordatorios cargado (múltiples tiempos)');

class RecordatorioManager {
    constructor() {
        this.tiemposSeleccionados = []; // ✅ Array de tiempos en minutos
        this.claseSeleccionada = null;
        this.timers = []; // ✅ Array de timers
        this.programado = false;
        this.init();
    }

    init() {
        setTimeout(() => this.cargarRecordatorioGuardado(), 1000);
        console.log('🔔 Sistema de recordatorios inicializado (múltiples tiempos)');
    }

    // ============================================
    // CAMBIAR ENTRE TABS (Notificación / ICS)
    // ============================================
    cambiarTab(tab) {
        const panelNotificacion = document.getElementById('panelNotificacion');
        const panelICS = document.getElementById('panelICS');
        const tabNotificacion = document.getElementById('tabNotificacion');
        const tabICS = document.getElementById('tabICS');
        
        if (tab === 'notificacion') {
            if (panelNotificacion) panelNotificacion.style.display = 'block';
            if (panelICS) panelICS.style.display = 'none';
            if (tabNotificacion) {
                tabNotificacion.style.background = 'var(--accent-color)';
                tabNotificacion.style.color = 'white';
            }
            if (tabICS) {
                tabICS.style.background = 'var(--bg-card)';
                tabICS.style.color = 'var(--text-secondary)';
            }
        } else {
            if (panelNotificacion) panelNotificacion.style.display = 'none';
            if (panelICS) panelICS.style.display = 'block';
            if (tabICS) {
                tabICS.style.background = 'var(--accent-color)';
                tabICS.style.color = 'white';
            }
            if (tabNotificacion) {
                tabNotificacion.style.background = 'var(--bg-card)';
                tabNotificacion.style.color = 'var(--text-secondary)';
            }
        }
    }

    // ============================================
    // SELECCIONAR/DESELECCIONAR TIEMPO (MÚLTIPLE)
    // ============================================
    toggleTiempo(minutos, btn) {
        const index = this.tiemposSeleccionados.indexOf(minutos);
        
        if (index > -1) {
            // ✅ Ya estaba seleccionado → deseleccionar
            this.tiemposSeleccionados.splice(index, 1);
            btn.classList.remove('active');
            btn.style.background = 'var(--bg-container)';
            btn.style.color = 'var(--text-primary)';
            btn.style.borderColor = 'var(--border-color)';
            console.log(`⏱️ Tiempo deseleccionado: ${minutos} min`);
        } else {
            // ✅ No estaba seleccionado → agregar
            this.tiemposSeleccionados.push(minutos);
            btn.classList.add('active');
            btn.style.background = 'var(--accent-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--accent-color)';
            console.log(`⏱️ Tiempo seleccionado: ${minutos} min`);
        }
        
        // Ordenar de mayor a menor (más lejano primero)
        this.tiemposSeleccionados.sort((a, b) => b - a);
        
        this.actualizarDisplayTiempos();
        this.ocultarMensaje();
    }

    // ============================================
    // ACTUALIZAR DISPLAY DE TIEMPOS SELECCIONADOS
    // ============================================
    actualizarDisplayTiempos() {
        const display = document.getElementById('tiempoSeleccionadoDisplay');
        if (!display) return;
        
        if (this.tiemposSeleccionados.length === 0) {
            display.textContent = '⏳ Selecciona uno o más tiempos para recibir notificaciones';
            display.style.color = 'var(--text-secondary)';
            display.style.background = 'rgba(66, 133, 244, 0.1)';
            display.style.border = '1px solid rgba(66, 133, 244, 0.3)';
            document.getElementById('btnProgramarRecordatorio').disabled = true;
            return;
        }
        
        const textos = this.tiemposSeleccionados.map(m => this.formatTiempo(m));
        const cantidad = this.tiemposSeleccionados.length;
        
        display.innerHTML = `
            ✅ <strong>${cantidad}</strong> recordatorio${cantidad > 1 ? 's' : ''} programado${cantidad > 1 ? 's' : ''}:<br>
            <span style="font-size: 0.9em;">${textos.map(t => `• ${t} antes`).join('<br>')}</span>
        `;
        display.style.color = 'var(--text-primary)';
        display.style.background = 'rgba(52, 168, 83, 0.1)';
        display.style.border = '1px solid rgba(52, 168, 83, 0.3)';
        
        const btnProgramar = document.getElementById('btnProgramarRecordatorio');
        if (btnProgramar) btnProgramar.disabled = false;
    }

    // ============================================
    // APLICAR TIEMPO PERSONALIZADO (AGREGA AL ARRAY)
    // ============================================
    aplicarTiempoPersonalizado() {
        const valorInput = document.getElementById('recordatorioPersonalizado');
        const unidadSelect = document.getElementById('recordatorioUnidad');
        
        if (!valorInput || !unidadSelect) return;
        
        const valor = parseInt(valorInput.value);
        const unidad = unidadSelect.value;
        
        if (!valor || valor < 1) {
            this.mostrarMensaje('Por favor, ingresa un número válido mayor a 0', 'error');
            return;
        }
        
        let minutos = valor;
        if (unidad === 'horas') minutos = valor * 60;
        if (unidad === 'dias') minutos = valor * 60 * 24;
        
        // ✅ Verificar que no esté ya en la lista
        if (this.tiemposSeleccionados.includes(minutos)) {
            this.mostrarMensaje('⚠️ Ese tiempo ya está en la lista', 'info');
            return;
        }
        
        // ✅ Agregar al array
        this.tiemposSeleccionados.push(minutos);
        this.tiemposSeleccionados.sort((a, b) => b - a);
        
        // ✅ Crear un botón visual para el tiempo personalizado
        const btn = this.crearBotonTiempo(minutos);
        
        // ✅ Insertar antes del botón "1 Semana" (o al final si no existe)
        const gridTiempos = document.querySelector('#panelNotificacion .tiempo-btn')?.parentElement;
        if (gridTiempos && btn) {
            gridTiempos.appendChild(btn);
        }
        
        // Limpiar input
        valorInput.value = '';
        
        this.actualizarDisplayTiempos();
        this.ocultarMensaje();
        console.log(`⏱️ Tiempo personalizado agregado: ${minutos} min`);
    }

    // ============================================
    // CREAR BOTÓN VISUAL PARA TIEMPO PERSONALIZADO
    // ============================================
    crearBotonTiempo(minutos) {
        const texto = this.formatTiempo(minutos);
        
        const btn = document.createElement('button');
        btn.className = 'tiempo-btn active';
        btn.dataset.minutos = minutos;
        btn.dataset.custom = 'true';
        btn.style.cssText = `
            padding: 12px;
            border: 2px solid var(--accent-color);
            border-radius: 8px;
            background: var(--accent-color);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            position: relative;
        `;
        btn.textContent = `${texto} ✕`;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.eliminarTiempoPersonalizado(minutos, btn);
        });
        
        return btn;
    }

    // ============================================
    // ELIMINAR TIEMPO PERSONALIZADO
    // ============================================
    eliminarTiempoPersonalizado(minutos, btn) {
        const index = this.tiemposSeleccionados.indexOf(minutos);
        if (index > -1) {
            this.tiemposSeleccionados.splice(index, 1);
        }
        
        if (btn && btn.parentNode) {
            btn.remove();
        }
        
        this.actualizarDisplayTiempos();
        console.log(`⏱️ Tiempo personalizado eliminado: ${minutos} min`);
    }

    // ============================================
    // FORMATO DE TIEMPO
    // ============================================
    formatTiempo(minutos) {
        if (minutos < 60) {
            return `${minutos} min`;
        } else if (minutos < 1440) {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return mins > 0 ? `${horas}h ${mins}min` : `${horas} hora${horas !== 1 ? 's' : ''}`;
        } else if (minutos < 10080) {
            const dias = Math.floor(minutos / 1440);
            const horas = Math.floor((minutos % 1440) / 60);
            return horas > 0 ? `${dias} día${dias !== 1 ? 's' : ''} y ${horas}h` : `${dias} día${dias !== 1 ? 's' : ''}`;
        } else {
            const semanas = Math.floor(minutos / 10080);
            const dias = Math.floor((minutos % 10080) / 1440);
            return dias > 0 ? `${semanas} sem y ${dias} día${dias !== 1 ? 's' : ''}` : `${semanas} semana${semanas !== 1 ? 's' : ''}`;
        }
    }

    // ============================================
    // ABRIR MODAL
    // ============================================
    abrirModal(clase) {
        if (!clase) return;
        
        this.claseSeleccionada = clase;
        this.tiemposSeleccionados = []; // ✅ Resetear array
        this.programado = false;
        
        // Resetear botones predefinidos
        document.querySelectorAll('.tiempo-btn:not([data-custom="true"])').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'var(--bg-container)';
            btn.style.color = 'var(--text-primary)';
            btn.style.borderColor = 'var(--border-color)';
        });
        
        // ✅ Eliminar botones personalizados previos
        document.querySelectorAll('.tiempo-btn[data-custom="true"]').forEach(btn => btn.remove());
        
        // Mostrar info de la clase
        document.getElementById('recordatorioClaseNombre').textContent = clase.nombre || 'Clase';
        
        let fechaFormateada = 'Fecha no disponible';
        if (clase.fechaClase) {
            const fecha = new Date(clase.fechaClase);
            fechaFormateada = fecha.toLocaleString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
        }
        document.getElementById('recordatorioClaseFecha').textContent = `📅 ${fechaFormateada}`;
        
        // Resetear display
        this.actualizarDisplayTiempos();
        
        const estado = document.getElementById('recordatorioEstado');
        if (estado) estado.style.display = 'none';
        
        const personalizado = document.getElementById('recordatorioPersonalizado');
        if (personalizado) personalizado.value = '';
        
        const btnProgramar = document.getElementById('btnProgramarRecordatorio');
        if (btnProgramar) {
            btnProgramar.disabled = true;
            btnProgramar.textContent = '🔔 Programar Notificaciones';
            btnProgramar.style.opacity = '1';
            btnProgramar.style.cursor = 'pointer';
        }
        
        this.ocultarMensaje();
        this.cambiarTab('notificacion');
        
        const modalRecordatorio = document.getElementById('modalRecordatorio');
        if (modalRecordatorio) {
            modalRecordatorio.style.display = 'flex';
            modalRecordatorio.style.zIndex = '20000';
        }
    }

    // ============================================
    // PROGRAMAR MÚLTIPLES RECORDATORIOS
    // ============================================
    programar() {
        if (this.tiemposSeleccionados.length === 0) {
            this.mostrarMensaje('Por favor, selecciona al menos un tiempo', 'error');
            return;
        }
        
        if (!this.claseSeleccionada) {
            this.mostrarMensaje('Error: No hay clase seleccionada', 'error');
            return;
        }
        
        // Verificar permisos
        if (!('Notification' in window)) {
            this.mostrarMensaje('❌ Tu navegador no soporta notificaciones', 'error');
            return;
        }
        
        if (Notification.permission === 'denied') {
            this.mostrarMensaje('❌ Permiso de notificaciones denegado. Actívalo en la configuración del navegador.', 'error');
            return;
        }
        
        if (Notification.permission === 'default') {
            this.mostrarMensaje('⏳ Solicitando permiso para mostrar notificaciones...', 'info');
            
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.mostrarMensaje('✅ Permiso concedido. Programando notificaciones...', 'success');
                    this._programarNotificaciones();
                } else {
                    this.mostrarMensaje('❌ Necesitas aceptar las notificaciones para usar esta función', 'error');
                }
            });
            return;
        }
        
        this._programarNotificaciones();
    }

    // ============================================
    // PROGRAMAR NOTIFICACIONES (INTERNO)
    // ============================================
    _programarNotificaciones() {
        // ✅ Limpiar timers anteriores
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
        
        const ahora = Date.now();
        
        // ✅ Ordenar de mayor a menor (más lejano primero)
        const tiemposOrdenados = [...this.tiemposSeleccionados].sort((a, b) => b - a);
        
        // ✅ Crear un timer por cada tiempo seleccionado
        tiemposOrdenados.forEach(minutos => {
            const tiempoMs = minutos * 60 * 1000;
            const timestamp = ahora + tiempoMs;
            const horaNotificacion = new Date(timestamp);
            
            const timerId = setTimeout(() => {
                this.enviarNotificacion(this.claseSeleccionada, minutos);
                
                // Eliminar este timer de la lista
                const idx = this.timers.indexOf(timerId);
                if (idx > -1) this.timers.splice(idx, 1);
                
                // Si ya no quedan timers, limpiar localStorage
                if (this.timers.length === 0) {
                    this.programado = false;
                    localStorage.removeItem('recordatoriosProgramados');
                }
            }, tiempoMs);
            
            this.timers.push(timerId);
            
            console.log(`🔔 Timer programado: ${this.formatTiempo(minutos)} antes (a las ${horaNotificacion.toLocaleString('es-AR')})`);
        });
        
        this.programado = true;
        
        // ✅ Guardar en localStorage
        const recordatoriosData = {
            claseId: this.claseSeleccionada._id,
            claseNombre: this.claseSeleccionada.nombre,
            fechaClase: this.claseSeleccionada.fechaClase,
            lugar: this.claseSeleccionada.lugar || 'No especificado',
            instructores: this.claseSeleccionada.instructores || [],
            tiempos: tiemposOrdenados, // ✅ Array de tiempos
            programado: true,
            timestampCreacion: ahora
        };
        
        try {
            localStorage.setItem('recordatoriosProgramados', JSON.stringify(recordatoriosData));
            console.log('💾 Recordatorios guardados en localStorage');
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
        
        // ✅ Mostrar confirmación
        const textos = tiemposOrdenados.map(m => this.formatTiempo(m));
        const estado = document.getElementById('recordatorioEstado');
        if (estado) {
            estado.style.display = 'block';
            estado.innerHTML = `
                ✅ <strong>${tiemposOrdenados.length}</strong> notificación${tiemposOrdenados.length > 1 ? 'es' : ''} programada${tiemposOrdenados.length > 1 ? 's' : ''}:
                <br>
                <div style="text-align: left; margin-top: 8px; font-size: 0.9em; line-height: 1.6;">
                    ${textos.map(t => `• ${t} antes de la clase`).join('<br>')}
                </div>
                <button onclick="recordatorioManager.cancelar()" style="
                    margin-top: 10px;
                    padding: 6px 16px;
                    border: 1px solid var(--error-500);
                    border-radius: 4px;
                    background: transparent;
                    color: var(--error-500);
                    cursor: pointer;
                    font-size: 0.85em;
                    font-weight: bold;
                ">❌ Cancelar todos</button>
            `;
            estado.style.background = 'rgba(52, 168, 83, 0.1)';
            estado.style.color = 'var(--success-500)';
            estado.style.border = '1px solid rgba(52, 168, 83, 0.3)';
            estado.style.padding = '12px';
            estado.style.borderRadius = '8px';
        }
        
        // Deshabilitar botón
        const btnProgramar = document.getElementById('btnProgramarRecordatorio');
        if (btnProgramar) {
            btnProgramar.disabled = true;
            btnProgramar.textContent = '✅ Programados';
            btnProgramar.style.opacity = '0.6';
            btnProgramar.style.cursor = 'not-allowed';
        }
        
        this.mostrarMensaje(`✅ ${tiemposOrdenados.length} notificación${tiemposOrdenados.length > 1 ? 'es' : ''} programada${tiemposOrdenados.length > 1 ? 's' : ''}`, 'success');
        this.reproducirSonido('confirmacion');
    }

    // ============================================
    // ENVIAR NOTIFICACIÓN (INDICA CUÁNTO FALTA)
    // ============================================
    enviarNotificacion(clase, minutosAntes) {
        let fechaFormateada = 'Fecha no disponible';
        if (clase.fechaClase) {
            const fecha = new Date(clase.fechaClase);
            fechaFormateada = fecha.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
        
        const instructores = clase.instructores && clase.instructores.length > 0 
            ? clase.instructores.join(', ') 
            : 'No especificados';
        
        const tiempoTexto = this.formatTiempo(minutosAntes);
        const titulo = `🔔 Clase en ${tiempoTexto}: ${clase.nombre}`;
        const cuerpo = `📅 ${fechaFormateada}\n📍 Lugar: ${clase.lugar || 'No especificado'}\n👥 Instructores: ${instructores}`;
        
        try {
            const notificacion = new Notification(titulo, {
                body: cuerpo,
                icon: '/img/logo.png',
                tag: `recordatorio_${clase._id}_${minutosAntes}`,
                requireInteraction: true,
                silent: false
            });
            
            this.reproducirSonido('notificacion');
            
            notificacion.onclick = function() {
                window.focus();
                if (clase.enlaceFormulario) {
                    window.open(clase.enlaceFormulario, '_blank');
                }
                this.close();
            };
            
            setTimeout(() => notificacion.close(), 30000);
            
            console.log(`🔔 Notificación enviada: faltan ${tiempoTexto}`);
        } catch (e) {
            console.error('❌ Error enviando notificación:', e);
        }
    }

    // ============================================
    // REPRODUCIR SONIDO
    // ============================================
    reproducirSonido(tipo) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (tipo === 'confirmacion') {
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } else {
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            console.log('🔇 Sonido no disponible');
        }
    }

    // ============================================
    // CANCELAR TODOS LOS RECORDATORIOS
    // ============================================
    cancelar() {
        // Limpiar todos los timers
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
        
        this.programado = false;
        this.tiemposSeleccionados = [];
        
        try {
            localStorage.removeItem('recordatoriosProgramados');
        } catch (e) {
            console.log('No se pudo eliminar de localStorage');
        }
        
        // Resetear UI
        document.querySelectorAll('.tiempo-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'var(--bg-container)';
            btn.style.color = 'var(--text-primary)';
            btn.style.borderColor = 'var(--border-color)';
        });
        document.querySelectorAll('.tiempo-btn[data-custom="true"]').forEach(btn => btn.remove());
        
        const estado = document.getElementById('recordatorioEstado');
        if (estado) estado.style.display = 'none';
        
        const btnProgramar = document.getElementById('btnProgramarRecordatorio');
        if (btnProgramar) {
            btnProgramar.disabled = true;
            btnProgramar.textContent = '🔔 Programar Notificaciones';
            btnProgramar.style.opacity = '1';
            btnProgramar.style.cursor = 'pointer';
        }
        
        this.actualizarDisplayTiempos();
        this.mostrarMensaje('✅ Todos los recordatorios cancelados', 'success');
        this.reproducirSonido('confirmacion');
    }

    // ============================================
    // CARGAR RECORDATORIOS GUARDADOS
    // ============================================
    cargarRecordatorioGuardado() {
        try {
            const data = localStorage.getItem('recordatoriosProgramados');
            if (!data) return;
            
            const recordatorio = JSON.parse(data);
            if (!recordatorio.programado || !recordatorio.tiempos) return;
            
            const ahora = Date.now();
            const fechaClaseMs = new Date(recordatorio.fechaClase).getTime();
            
            // Reconstruir la clase
            this.claseSeleccionada = {
                _id: recordatorio.claseId,
                nombre: recordatorio.claseNombre,
                fechaClase: recordatorio.fechaClase,
                lugar: recordatorio.lugar || 'No especificado',
                instructores: recordatorio.instructores || []
            };
            
            // Reprogramar cada tiempo
            let reprogramados = 0;
            recordatorio.tiempos.forEach(minutos => {
                const tiempoRestante = (fechaClaseMs - ahora) - (minutos * 60 * 1000);
                
                if (tiempoRestante > 0) {
                    const timerId = setTimeout(() => {
                        this.enviarNotificacion(this.claseSeleccionada, minutos);
                        
                        const idx = this.timers.indexOf(timerId);
                        if (idx > -1) this.timers.splice(idx, 1);
                        
                        if (this.timers.length === 0) {
                            this.programado = false;
                            localStorage.removeItem('recordatoriosProgramados');
                        }
                    }, tiempoRestante);
                    
                    this.timers.push(timerId);
                    reprogramados++;
                    
                    console.log(`🔄 Recordatorio reprogramado: ${this.formatTiempo(minutos)} antes`);
                } else {
                    console.log(`⏹️ Recordatorio ya pasó: ${this.formatTiempo(minutos)} antes`);
                }
            });
            
            this.programado = reprogramados > 0;
            console.log(`🔄 ${reprogramados} recordatorios reprogramados de ${recordatorio.tiempos.length}`);
            
        } catch (e) {
            console.log('Error cargando recordatorios guardados:', e);
            localStorage.removeItem('recordatoriosProgramados');
        }
    }

    // ============================================
    // MENSAJES
    // ============================================
    mostrarMensaje(texto, tipo) {
        const msg = document.getElementById('recordatorioMensaje');
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `mensaje ${tipo}`;
        msg.style.display = 'block';
    }

    ocultarMensaje() {
        const msg = document.getElementById('recordatorioMensaje');
        if (msg) msg.style.display = 'none';
    }

    // ============================================
    // CERRAR MODAL
    // ============================================
    cerrarModal() {
        const modal = document.getElementById('modalRecordatorio');
        if (modal) modal.style.display = 'none';
        this.ocultarMensaje();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.recordatorioManager = new RecordatorioManager();
});