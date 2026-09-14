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
// ✅ NUEVO: ELIMINAR UN TIEMPO INDIVIDUAL
// ============================================
eliminarTiempo(minutos) {
    console.log(`🗑️ Eliminando tiempo: ${minutos} min`);
    
    // ✅ Quitar del array
    const index = this.tiemposSeleccionados.indexOf(minutos);
    if (index > -1) {
        this.tiemposSeleccionados.splice(index, 1);
    }
    
    // ✅ Desmarcar botón predefinido si existe
    const btnPredefinido = document.querySelector(`.tiempo-btn[data-minutos="${minutos}"]:not([data-custom="true"])`);
    if (btnPredefinido) {
        btnPredefinido.classList.remove('active');
        btnPredefinido.style.background = 'var(--bg-container)';
        btnPredefinido.style.color = 'var(--text-primary)';
        btnPredefinido.style.borderColor = 'var(--border-color)';
    }
    
    // ✅ Eliminar botón personalizado si existe
    const btnCustom = document.querySelector(`.tiempo-btn[data-custom="true"][data-minutos="${minutos}"]`);
    if (btnCustom) {
        btnCustom.remove();
    }
    
    // ✅ Actualizar display
    this.actualizarDisplayTiempos();
    
    // ✅ Si ya no hay tiempos, limpiar el estado verde
    if (this.tiemposSeleccionados.length === 0) {
        const estado = document.getElementById('recordatorioEstado');
        if (estado) estado.style.display = 'none';
    }
    
    console.log(`✅ Tiempo eliminado. Quedan: ${this.tiemposSeleccionados.length}`);
}

// ============================================
// ✅ NUEVO: ELIMINAR TODOS LOS TIEMPOS SELECCIONADOS
// ============================================
eliminarTodosLosTiempos() {
    console.log('🗑️ Eliminando todos los tiempos seleccionados');
    
    if (this.tiemposSeleccionados.length === 0) return;
    
    // ✅ Desmarcar todos los botones predefinidos
    document.querySelectorAll('.tiempo-btn:not([data-custom="true"])').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'var(--bg-container)';
        btn.style.color = 'var(--text-primary)';
        btn.style.borderColor = 'var(--border-color)';
    });
    
    // ✅ Eliminar todos los botones personalizados
    document.querySelectorAll('.tiempo-btn[data-custom="true"]').forEach(btn => btn.remove());
    
    // ✅ Vaciar el array
    this.tiemposSeleccionados = [];
    
    // ✅ Actualizar display
    this.actualizarDisplayTiempos();
    
    // ✅ Limpiar estado verde
    const estado = document.getElementById('recordatorioEstado');
    if (estado) estado.style.display = 'none';
    
    // ✅ Resetear botón programar
    const btnProgramar = document.getElementById('btnProgramarRecordatorio');
    if (btnProgramar) {
        btnProgramar.textContent = '🔔 Programar Notificaciones';
        btnProgramar.disabled = true;
    }
    
    console.log('✅ Todos los tiempos eliminados');
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
        const btnProgramar = document.getElementById('btnProgramarRecordatorio');
        if (btnProgramar) btnProgramar.disabled = true;
        return;
    }
    
    const cantidad = this.tiemposSeleccionados.length;
    
    // ✅ Crear la lista con botones ✕ por cada tiempo
    const tiemposHTML = this.tiemposSeleccionados.map(minutos => {
        const texto = this.formatTiempo(minutos);
        return `
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 6px 10px;
                background: var(--bg-container);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                margin-bottom: 4px;
            ">
                <span style="font-size: 0.9em;">⏰ ${texto} antes</span>
                <button 
                    type="button"
                    onclick="recordatorioManager.eliminarTiempo(${minutos})" 
                    title="Eliminar este recordatorio"
                    style="
                        background: transparent;
                        border: 1px solid var(--error-500);
                        color: var(--error-500);
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        min-width: 24px;
                        cursor: pointer;
                        font-size: 0.8em;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        padding: 0;
                    "
                    onmouseover="this.style.background='var(--error-500)'; this.style.color='white';"
                    onmouseout="this.style.background='transparent'; this.style.color='var(--error-500)';">
                    ✕
                </button>
            </div>
        `;
    }).join('');
    
    display.innerHTML = `
        <div style="text-align: left;">
            ✅ <strong>${cantidad}</strong> recordatorio${cantidad > 1 ? 's' : ''} seleccionado${cantidad > 1 ? 's' : ''}:
            <div style="margin-top: 8px;">
                ${tiemposHTML}
            </div>
            ${cantidad > 1 ? `
                <button 
                    type="button"
                    onclick="recordatorioManager.eliminarTodosLosTiempos()" 
                    style="
                        width: 100%;
                        margin-top: 8px;
                        padding: 6px 12px;
                        background: transparent;
                        border: 1px solid var(--error-500);
                        color: var(--error-500);
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85em;
                        font-weight: bold;
                        transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='var(--error-500)'; this.style.color='white';"
                    onmouseout="this.style.background='transparent'; this.style.color='var(--error-500)';">
                    🗑️ Eliminar todos
                </button>
            ` : ''}
        </div>
    `;
    display.style.color = 'var(--text-primary)';
    display.style.background = 'rgba(52, 168, 83, 0.1)';
    display.style.border = '1px solid rgba(52, 168, 83, 0.3)';
    display.style.padding = '12px';
    
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
    this.tiemposSeleccionados = []; // Resetear array
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
    
    // ✅ NUEVO: Cargar recordatorios existentes para esta clase
    this.cargarRecordatoriosDeClase(clase._id);
    
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
    
    // Actualizar display
    this.actualizarDisplayTiempos();
    
    const estado = document.getElementById('recordatorioEstado');
    if (estado) estado.style.display = 'none';
    
    const personalizado = document.getElementById('recordatorioPersonalizado');
    if (personalizado) personalizado.value = '';
    
    const btnProgramar = document.getElementById('btnProgramarRecordatorio');
    if (btnProgramar) {
        btnProgramar.disabled = this.tiemposSeleccionados.length === 0;
        btnProgramar.textContent = '🔔 Programar Notificaciones';
        btnProgramar.style.opacity = this.tiemposSeleccionados.length === 0 ? '0.6' : '1';
        btnProgramar.style.cursor = this.tiemposSeleccionados.length === 0 ? 'not-allowed' : 'pointer';
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
// ✅ NUEVO: CARGAR RECORDATORIOS EXISTENTES DE LA CLASE
// ============================================
cargarRecordatoriosDeClase(claseId) {
    try {
        const data = localStorage.getItem('recordatoriosProgramados');
        if (!data) return;
        
        const recordatorio = JSON.parse(data);
        
        // ✅ Verificar que sea para esta clase
        if (recordatorio.claseId !== claseId) return;
        if (!recordatorio.programado || !recordatorio.tiempos) return;
        
        console.log(`📥 Recordatorios encontrados para esta clase: ${recordatorio.tiempos.length}`);
        
        // ✅ Cargar los tiempos en el array
        this.tiemposSeleccionados = [...recordatorio.tiempos];
        this.programado = true;
        
        // ✅ Marcar los botones predefinidos que coincidan
        this.tiemposSeleccionados.forEach(minutos => {
            // Buscar si hay un botón predefinido con ese tiempo
            const btnPredefinido = document.querySelector(`.tiempo-btn[data-minutos="${minutos}"]:not([data-custom="true"])`);
            
            if (btnPredefinido) {
                // Marcar el botón predefinido
                btnPredefinido.classList.add('active');
                btnPredefinido.style.background = 'var(--accent-color)';
                btnPredefinido.style.color = 'white';
                btnPredefinido.style.borderColor = 'var(--accent-color)';
                console.log(`✅ Botón marcado: ${minutos} min`);
            } else {
                // ✅ Crear botón personalizado para este tiempo
                const btnCustom = this.crearBotonTiempo(minutos);
                const gridTiempos = document.querySelector('#panelNotificacion .tiempo-btn')?.parentElement;
                if (gridTiempos && btnCustom) {
                    gridTiempos.appendChild(btnCustom);
                    console.log(`✅ Botón personalizado creado: ${minutos} min`);
                }
            }
        });

        // ✅ Mostrar el estado verde si hay recordatorios activos
if (this.tiemposSeleccionados.length > 0) {
    const textos = this.tiemposSeleccionados.map(m => this.formatTiempo(m));
    const estado = document.getElementById('recordatorioEstado');
    if (estado) {
        estado.style.display = 'block';
        estado.innerHTML = `
            🔔 <strong>${this.tiemposSeleccionados.length}</strong> recordatorio${this.tiemposSeleccionados.length > 1 ? 's' : ''} ya programado${this.tiemposSeleccionados.length > 1 ? 's' : ''}:
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
    
    // Cambiar el texto del botón
    const btnProgramar = document.getElementById('btnProgramarRecordatorio');
    if (btnProgramar) {
        btnProgramar.textContent = '💾 Guardar cambios';
    }
}
        
        // ✅ Actualizar el display
        this.actualizarDisplayTiempos();
        
        console.log(`✅ Recordatorios cargados: ${this.tiemposSeleccionados.join(', ')} min`);
        
    } catch (e) {
        console.error('❌ Error cargando recordatorios de la clase:', e);
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

// ✅ Cerrar el modal automáticamente después de 2.5 segundos
setTimeout(() => {
    this.cerrarModal();
}, 2500);
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