// ============================================
// SISTEMA DE RECORDATORIOS CON NOTIFICACIONES
// ============================================
console.log('🔔 Módulo de recordatorios cargado');

class RecordatorioManager {
    constructor() {
        this.tiempoMinutos = 0;
        this.claseSeleccionada = null;
        this.timerId = null;
        this.programado = false;
        this.init();
    }

    init() {
        // Cargar recordatorio guardado al iniciar
        setTimeout(() => this.cargarRecordatorioGuardado(), 1000);
        // Solicitar permisos
        setTimeout(() => this.solicitarPermiso(), 2000);
    }

    // Solicitar permisos de notificación
    solicitarPermiso() {
        if (!('Notification' in window)) {
            console.log('⚠️ Este navegador no soporta notificaciones');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            console.log('✅ Permiso de notificaciones concedido');
            return true;
        }
        
        if (Notification.permission === 'denied') {
            console.log('❌ Permiso de notificaciones denegado');
            return false;
        }
        
        // Solicitar permiso
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Permiso de notificaciones concedido');
                return true;
            } else {
                console.log('❌ Permiso de notificaciones denegado');
                return false;
            }
        });
    }

    // Abrir modal de recordatorio
    abrirModal(clase) {
        if (!clase) return;
        
        this.claseSeleccionada = clase;
        this.tiempoMinutos = 0;
        this.programado = false;
        
        // Resetear selección de botones
        document.querySelectorAll('.tiempo-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'var(--bg-container)';
            btn.style.color = 'var(--text-primary)';
            btn.style.borderColor = 'var(--border-color)';
        });
        
        // Mostrar información de la clase
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
        document.getElementById('tiempoSeleccionadoDisplay').textContent = '⏳ Selecciona un tiempo para recibir la notificación';
        document.getElementById('tiempoSeleccionadoDisplay').style.color = 'var(--text-secondary)';
        document.getElementById('tiempoSeleccionadoDisplay').style.background = 'rgba(66, 133, 244, 0.1)';
        document.getElementById('tiempoSeleccionadoDisplay').style.border = '1px solid rgba(66, 133, 244, 0.3)';
        document.getElementById('recordatorioEstado').style.display = 'none';
        document.getElementById('recordatorioPersonalizado').value = '';
        document.getElementById('btnProgramarRecordatorio').disabled = false;
        document.getElementById('btnProgramarRecordatorio').textContent = '🔔 Programar Notificación';
        
        // Mostrar modal
        document.getElementById('modalRecordatorio').style.display = 'flex';
        
        // Verificar permisos
        this.solicitarPermiso();
    }

    // Seleccionar tiempo predefinido
    seleccionarTiempo(minutos, btn) {
        // Desmarcar todos
        document.querySelectorAll('.tiempo-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'var(--bg-container)';
            b.style.color = 'var(--text-primary)';
            b.style.borderColor = 'var(--border-color)';
        });
        
        // Marcar el seleccionado
        btn.classList.add('active');
        btn.style.background = 'var(--accent-color)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--accent-color)';
        
        this.tiempoMinutos = minutos;
        
        // Mostrar tiempo seleccionado
        const texto = this.formatTiempo(minutos);
        document.getElementById('tiempoSeleccionadoDisplay').textContent = `⏳ Recibirás la notificación en ${texto}`;
        document.getElementById('tiempoSeleccionadoDisplay').style.color = 'var(--text-primary)';
        document.getElementById('tiempoSeleccionadoDisplay').style.background = 'rgba(52, 168, 83, 0.1)';
        document.getElementById('tiempoSeleccionadoDisplay').style.border = '1px solid rgba(52, 168, 83, 0.3)';
        
        // Habilitar botón de programar
        document.getElementById('btnProgramarRecordatorio').disabled = false;
        
        this.ocultarMensaje();
    }

    // Aplicar tiempo personalizado
    aplicarTiempoPersonalizado() {
        const valor = parseInt(document.getElementById('recordatorioPersonalizado').value);
        const unidad = document.getElementById('recordatorioUnidad').value;
        
        if (!valor || valor < 1) {
            this.mostrarMensaje('Por favor, ingresa un número válido', 'error');
            return;
        }
        
        let minutos = valor;
        if (unidad === 'horas') minutos = valor * 60;
        if (unidad === 'dias') minutos = valor * 60 * 24;
        
        // Desmarcar botones predefinidos
        document.querySelectorAll('.tiempo-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'var(--bg-container)';
            b.style.color = 'var(--text-primary)';
            b.style.borderColor = 'var(--border-color)';
        });
        
        this.tiempoMinutos = minutos;
        
        const texto = this.formatTiempo(minutos);
        document.getElementById('tiempoSeleccionadoDisplay').textContent = `⏳ Recibirás la notificación en ${texto} (personalizado)`;
        document.getElementById('tiempoSeleccionadoDisplay').style.color = 'var(--text-primary)';
        document.getElementById('tiempoSeleccionadoDisplay').style.background = 'rgba(52, 168, 83, 0.1)';
        document.getElementById('tiempoSeleccionadoDisplay').style.border = '1px solid rgba(52, 168, 83, 0.3)';
        
        // Habilitar botón de programar
        document.getElementById('btnProgramarRecordatorio').disabled = false;
        
        this.ocultarMensaje();
    }

    // Formatear tiempo para mostrar
    formatTiempo(minutos) {
        if (minutos < 60) {
            return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        } else if (minutos < 1440) {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return mins > 0 ? `${horas} hora${horas !== 1 ? 's' : ''} y ${mins} minuto${mins !== 1 ? 's' : ''}` : `${horas} hora${horas !== 1 ? 's' : ''}`;
        } else if (minutos < 10080) {
            const dias = Math.floor(minutos / 1440);
            const horas = Math.floor((minutos % 1440) / 60);
            return horas > 0 ? `${dias} día${dias !== 1 ? 's' : ''} y ${horas} hora${horas !== 1 ? 's' : ''}` : `${dias} día${dias !== 1 ? 's' : ''}`;
        } else {
            const semanas = Math.floor(minutos / 10080);
            const dias = Math.floor((minutos % 10080) / 1440);
            return dias > 0 ? `${semanas} semana${semanas !== 1 ? 's' : ''} y ${dias} día${dias !== 1 ? 's' : ''}` : `${semanas} semana${semanas !== 1 ? 's' : ''}`;
        }
    }

    // Mostrar mensaje en el modal
    mostrarMensaje(texto, tipo) {
        const msg = document.getElementById('recordatorioMensaje');
        msg.textContent = texto;
        msg.className = `mensaje ${tipo}`;
        msg.style.display = 'block';
    }

    ocultarMensaje() {
        document.getElementById('recordatorioMensaje').style.display = 'none';
    }

    // Programar recordatorio
    programar() {
        if (this.tiempoMinutos <= 0) {
            this.mostrarMensaje('Por favor, selecciona un tiempo para la notificación', 'error');
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
            this.mostrarMensaje('❌ Permiso de notificaciones denegado. Actívalo en la configuración de tu navegador.', 'error');
            return;
        }
        
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.programar();
                } else {
                    this.mostrarMensaje('❌ Necesitas aceptar las notificaciones para usar esta función', 'error');
                }
            });
            return;
        }
        
        // Programar la notificación
        const tiempoMs = this.tiempoMinutos * 60 * 1000;
        const ahora = Date.now();
        const horaNotificacion = new Date(ahora + tiempoMs);
        
        // Limpiar timer anterior si existe
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        
        // Programar la notificación
        this.timerId = setTimeout(() => {
            this.enviarNotificacion(this.claseSeleccionada);
            this.programado = false;
            this.timerId = null;
            localStorage.removeItem('recordatorioProgramado');
        }, tiempoMs);
        
        this.programado = true;
        
        // Guardar en localStorage para persistencia
        const recordatorioData = {
            claseId: this.claseSeleccionada._id,
            claseNombre: this.claseSeleccionada.nombre,
            fechaClase: this.claseSeleccionada.fechaClase,
            lugar: this.claseSeleccionada.lugar || 'No especificado',
            instructores: this.claseSeleccionada.instructores || [],
            tiempoMinutos: this.tiempoMinutos,
            timestamp: ahora + tiempoMs,
            programado: true
        };
        
        try {
            localStorage.setItem('recordatorioProgramado', JSON.stringify(recordatorioData));
        } catch (e) {
            console.log('No se pudo guardar en localStorage');
        }
        
        // Mostrar confirmación
        const texto = this.formatTiempo(this.tiempoMinutos);
        document.getElementById('recordatorioEstado').style.display = 'block';
        document.getElementById('recordatorioEstado').innerHTML = `
            ✅ Notificación programada para dentro de ${texto}
            <br>
            <span style="font-size: 0.8em; color: var(--text-muted);">
                📅 ${horaNotificacion.toLocaleString('es-AR')}
            </span>
            <br>
            <button onclick="recordatorioManager.cancelar()" style="
                margin-top: 8px;
                padding: 5px 15px;
                border: 1px solid var(--error-500);
                border-radius: 4px;
                background: transparent;
                color: var(--error-500);
                cursor: pointer;
                font-size: 0.8em;
                transition: all 0.3s ease;
            "
            onmouseover="this.style.background='var(--error-500)'; this.style.color='white';"
            onmouseout="this.style.background='transparent'; this.style.color='var(--error-500)';">
                ❌ Cancelar recordatorio
            </button>
        `;
        document.getElementById('recordatorioEstado').style.background = 'rgba(52, 168, 83, 0.1)';
        document.getElementById('recordatorioEstado').style.color = 'var(--success-500)';
        document.getElementById('recordatorioEstado').style.border = '1px solid rgba(52, 168, 83, 0.3)';
        
        // Deshabilitar botón de programar
        document.getElementById('btnProgramarRecordatorio').disabled = true;
        document.getElementById('btnProgramarRecordatorio').textContent = '✅ Programado';
        
        this.mostrarMensaje(`✅ Notificación programada para dentro de ${texto}`, 'success');
        
        // Reproducir sonido de confirmación (usando Web Audio API)
        this.reproducirSonido('confirmacion');
    }

    // Enviar notificación
    enviarNotificacion(clase) {
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
        
        const titulo = `🔔 Recordatorio: ${clase.nombre}`;
        const cuerpo = `📅 La clase comienza el ${fechaFormateada}\n📍 Lugar: ${clase.lugar || 'No especificado'}\n👥 Instructores: ${instructores}`;
        
        // Crear notificación
        const notificacion = new Notification(titulo, {
            body: cuerpo,
            icon: '/img/logo.png',
            tag: `recordatorio_${clase._id}`,
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
        });
        
        // Reproducir sonido al recibir notificación
        this.reproducirSonido('notificacion');
        
        // Acción al hacer clic en la notificación
        notificacion.onclick = function() {
            window.focus();
            if (clase.enlaceFormulario || clase.enlaces?.youtube) {
                const enlace = clase.enlaceFormulario || clase.enlaces?.youtube;
                window.open(enlace, '_blank');
            }
            this.close();
        };
        
        // Cerrar automáticamente después de 30 segundos
        setTimeout(() => {
            notificacion.close();
        }, 30000);
        
        console.log('🔔 Notificación enviada:', titulo);
    }

    // Reproducir sonido con Web Audio API (sin archivos externos)
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
                // Sonido de confirmación (dos tonos ascendentes)
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // Do
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // Mi
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } else {
                // Sonido de notificación (tono corto y agudo)
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // La
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            // Silenciar errores si el navegador no soporta Web Audio API
            console.log('🔇 Sonido no disponible');
        }
    }

    // Cancelar recordatorio
    cancelar() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        
        this.programado = false;
        
        try {
            localStorage.removeItem('recordatorioProgramado');
        } catch (e) {
            console.log('No se pudo eliminar de localStorage');
        }
        
        document.getElementById('recordatorioEstado').style.display = 'none';
        document.getElementById('btnProgramarRecordatorio').disabled = false;
        document.getElementById('btnProgramarRecordatorio').textContent = '🔔 Programar Notificación';
        document.getElementById('tiempoSeleccionadoDisplay').textContent = '⏳ Recordatorio cancelado';
        document.getElementById('tiempoSeleccionadoDisplay').style.color = 'var(--text-muted)';
        document.getElementById('tiempoSeleccionadoDisplay').style.background = 'rgba(234, 67, 53, 0.1)';
        document.getElementById('tiempoSeleccionadoDisplay').style.border = '1px solid rgba(234, 67, 53, 0.3)';
        
        this.mostrarMensaje('✅ Recordatorio cancelado', 'success');
        this.reproducirSonido('confirmacion');
    }

    // Cargar recordatorio guardado
    cargarRecordatorioGuardado() {
        try {
            const data = localStorage.getItem('recordatorioProgramado');
            if (!data) return;
            
            const recordatorio = JSON.parse(data);
            if (!recordatorio.programado) return;
            
            const ahora = Date.now();
            const tiempoRestante = recordatorio.timestamp - ahora;
            
            if (tiempoRestante <= 0) {
                localStorage.removeItem('recordatorioProgramado');
                return;
            }
            
            // Re-programar la notificación
            const minutosRestantes = Math.round(tiempoRestante / (60 * 1000));
            console.log(`🔄 Recordatorio guardado encontrado: ${recordatorio.claseNombre} (en ${minutosRestantes} minutos)`);
            
            this.tiempoMinutos = minutosRestantes;
            this.claseSeleccionada = {
                _id: recordatorio.claseId,
                nombre: recordatorio.claseNombre,
                fechaClase: recordatorio.fechaClase,
                lugar: recordatorio.lugar || 'No especificado',
                instructores: recordatorio.instructores || []
            };
            
            if (this.timerId) {
                clearTimeout(this.timerId);
            }
            
            this.timerId = setTimeout(() => {
                this.enviarNotificacion(this.claseSeleccionada);
                this.programado = false;
                this.timerId = null;
                localStorage.removeItem('recordatorioProgramado');
            }, tiempoRestante);
            
            this.programado = true;
            
        } catch (e) {
            console.log('Error cargando recordatorio guardado:', e);
            localStorage.removeItem('recordatorioProgramado');
        }
    }

    // Cerrar modal
    cerrarModal() {
        document.getElementById('modalRecordatorio').style.display = 'none';
        this.ocultarMensaje();
    }

        // Cambiar entre tabs (Notificación / ICS)
    cambiarTab(tab) {
        const panelNotificacion = document.getElementById('panelNotificacion');
        const panelICS = document.getElementById('panelICS');
        const tabNotificacion = document.getElementById('tabNotificacion');
        const tabICS = document.getElementById('tabICS');
        
        if (tab === 'notificacion') {
            panelNotificacion.style.display = 'block';
            panelICS.style.display = 'none';
            tabNotificacion.style.background = 'var(--accent-color)';
            tabNotificacion.style.color = 'white';
            tabICS.style.background = 'var(--bg-card)';
            tabICS.style.color = 'var(--text-secondary)';
        } else {
            panelNotificacion.style.display = 'none';
            panelICS.style.display = 'block';
            tabICS.style.background = 'var(--accent-color)';
            tabICS.style.color = 'white';
            tabNotificacion.style.background = 'var(--bg-card)';
            tabNotificacion.style.color = 'var(--text-secondary)';
        }
    }

    // Descargar archivo .ICS
    descargarICS() {
        if (!this.claseSeleccionada) {
            this.mostrarMensaje('❌ No hay clase seleccionada', 'error');
            return;
        }
        
        const clase = this.claseSeleccionada;
        
        // Generar el archivo ICS
        const icsContent = this.generarICS(clase);
        
        // Crear y descargar el archivo
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recordatorio_${(clase.nombre || 'clase').replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        this.mostrarMensaje('✅ Archivo .ICS descargado correctamente', 'success');
        this.reproducirSonido('confirmacion');
    }

    // Generar contenido ICS
    generarICS(clase) {
        // Determinar fecha de inicio
        let inicio;
        if (clase.fechaApertura) {
            inicio = new Date(clase.fechaApertura);
        } else if (clase.fechaClase) {
            inicio = new Date(clase.fechaClase);
        } else {
            inicio = new Date();
        }
        
        // Duración de la clase (1 hora por defecto)
        const duracion = 60 * 60 * 1000; // 1 hora
        const fin = new Date(inicio.getTime() + duracion);
        
        // Formatear fechas para ICS
        function formatDateForICS(date) {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        }
        
        const now = new Date();
        const dtstamp = formatDateForICS(now);
        const dtstart = formatDateForICS(inicio);
        const dtend = formatDateForICS(fin);
        
        // Escapar texto para ICS
        function escapeICS(text) {
            if (!text) return '';
            return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
        }
        
        const summary = escapeICS(clase.nombre || 'Clase');
        const description = escapeICS(clase.descripcion || '');
        const location = escapeICS(clase.lugar || '');
        
        // Agregar instructores a la descripción
        let fullDescription = description;
        if (clase.instructores && clase.instructores.length > 0) {
            const instructoresText = 'Instructores: ' + clase.instructores.join(', ');
            fullDescription = fullDescription ? `${fullDescription}\n\n${instructoresText}` : instructoresText;
        }
        
        // Generar UID único
        const uid = `${clase._id || Date.now()}@recordatorio-enfermeria.com`;
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Mi Aula de Enfermería//Recordatorio Clase//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${escapeICS(fullDescription)}`,
            `LOCATION:${location}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        
        return icsContent;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.recordatorioManager = new RecordatorioManager();
});