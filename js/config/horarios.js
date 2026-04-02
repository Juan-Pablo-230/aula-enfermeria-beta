// config/horarios.js - Sistema completo de horarios de clases
console.log('⏰ Cargando sistema de horarios...');

const HORARIOS_CONFIG = {
    // ===== CONFIGURACIÓN GLOBAL =====
    GLOBAL: {
        // Horarios por defecto (se usan si no hay configuración específica)
        DEFAULT: {
            horaApertura: 0,      // 00:00 (medianoche)
            horaCierre: 20,        // 20:00 (8:00 PM)
            duracionClase: 60,     // 60 minutos
            diasAnticipacion: 7,    // Se pueden inscribir hasta 7 días antes
            minutosAntesCierre: 10  // Cierra 10 minutos antes (lo que pediste)
        },
        
        // Días de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
        DIAS: {
            APERTURA: 1,    // Lunes
            CIERRE: 6        // Sábado
        }
    },

    // ===== CONFIGURACIÓN POR TIPO DE CLASE =====
    TIPOS: {
        'PUBLICA': {
            horaApertura: 8,      // 8:00 AM
            horaCierre: 18,        // 6:00 PM
            duracion: 90,          // 90 minutos
            color: '#4285f4',
            icono: '📢'
        },
        'GESTION': {
            horaApertura: 9,       // 9:00 AM
            horaCierre: 17,         // 5:00 PM
            duracion: 60,           // 60 minutos
            color: '#34a853',
            icono: '📚'
        },
        'TALLER': {
            horaApertura: 14,       // 2:00 PM
            horaCierre: 16,         // 4:00 PM
            duracion: 120,          // 120 minutos
            color: '#ea4335',
            icono: '🔧'
        }
    },

    // ===== CONFIGURACIÓN ESPECÍFICA POR ID DE CLASE =====
    // Aquí puedes definir horarios para clases específicas
    CLASES: {
        // Formato: 'ID_CLASE': { ...configuración... }
        'ejemplo123': {
            nombre: 'Clase de Ejemplo',
            fechaApertura: '2026-03-10',     // Fecha específica
            horaApertura: 10,                  // 10:00 AM
            fechaCierre: '2026-03-10',         // Mismo día
            horaCierre: 20,                     // 8:00 PM
            duracion: 90,
            lugar: 'Aula Virtual',
            instructores: ['Dr. Ejemplo']
        }
    },

    // ===== FUNCIÓN PARA GENERAR HORARIO BASADO EN HASH DEL ID =====
    generarHorarioDesdeId: function(claseId, claseNombre = '', tipo = 'PUBLICA') {
        // Generar hash a partir del ID
        let hash = 0;
        for (let i = 0; i < claseId.length; i++) {
            hash = ((hash << 5) - hash) + claseId.charCodeAt(i);
            hash = hash & hash;
        }
        hash = Math.abs(hash);
        
        // Obtener configuración base según tipo
        const base = this.TIPOS[tipo] || this.TIPOS.PUBLICA;
        
        // Usar el hash para generar variaciones (pero mantener consistencia)
        const variacionHora = (hash % 3) - 1; // -1, 0, o 1 hora de diferencia
        const variacionDia = hash % 5; // 0-4 días de diferencia
        
        // Calcular fechas
        const hoy = new Date();
        const fechaApertura = new Date(hoy);
        fechaApertura.setDate(hoy.getDate() + variacionDia);
        
        const fechaCierre = new Date(fechaApertura);
        fechaCierre.setHours(base.horaCierre, 0, 0, 0);
        
        // Aplicar offset de minutos antes del cierre (lo que pediste)
        const minutosAntesCierre = this.GLOBAL.DEFAULT.minutosAntesCierre;
        const horaCierreEfectiva = base.horaCierre;
        const minutosCierreEfectivos = 0 - minutosAntesCierre; // Restar minutos
        
        return {
            // Fechas de apertura/cierre
            fechaApertura: fechaApertura.toISOString().split('T')[0],
            horaApertura: base.horaApertura + variacionHora,
            fechaCierre: fechaCierre.toISOString().split('T')[0],
            horaCierre: horaCierreEfectiva,
            
            // Horario de la clase
            horaInicio: base.horaApertura + variacionHora,
            horaFin: base.horaApertura + variacionHora + Math.floor(base.duracion / 60),
            duracion: base.duracion,
            
            // Metadata
            lugar: `Sala ${Math.floor(hash % 100)}`,
            instructores: [`Instructor ${Math.floor(hash % 5) + 1}`],
            color: base.color,
            icono: base.icono,
            
            // Timestamps completos para comparación
            timestampApertura: new Date(fechaApertura).setHours(base.horaApertura + variacionHora, 0, 0, 0),
            timestampCierre: new Date(fechaCierre).setHours(horaCierreEfectiva, minutosCierreEfectivos, 0, 0),
            
            // Texto formateado para mostrar
            textoApertura: `${fechaApertura.toLocaleDateString()} ${base.horaApertura + variacionHora}:00`,
            textoCierre: `${fechaCierre.toLocaleDateString()} ${horaCierreEfectiva}:${Math.abs(minutosCierreEfectivos).toString().padStart(2, '0')}`,
            
            // Si está abierta ahora
            estaAbiertaAhora: function() {
                const ahora = Date.now();
                return ahora >= this.timestampApertura && ahora <= this.timestampCierre;
            }
        };
    },

    // ===== FUNCIÓN PRINCIPAL PARA OBTENER HORARIO DE UNA CLASE =====
    obtenerHorario: function(claseId, claseNombre = '', fechaClase = null) {
        // 1. Buscar si hay configuración específica para esta clase
        if (this.CLASES[claseId]) {
            return this.CLASES[claseId];
        }
        
        // 2. Determinar tipo de clase por el nombre o ID
        let tipo = 'PUBLICA';
        if (claseNombre?.toLowerCase().includes('gestion') || 
            claseNombre?.toLowerCase().includes('gestión')) {
            tipo = 'GESTION';
        } else if (claseNombre?.toLowerCase().includes('taller')) {
            tipo = 'TALLER';
        }
        
        // 3. Generar horario basado en hash del ID
        const horario = this.generarHorarioDesdeId(claseId, claseNombre, tipo);
        
        // 4. Si se proporciona fechaClase, usarla
        if (fechaClase) {
            const fecha = new Date(fechaClase);
            horario.fechaApertura = fecha.toISOString().split('T')[0];
            horario.timestampApertura = fecha.setHours(horario.horaApertura, 0, 0, 0);
        }
        
        return horario;
    },

    // ===== VERIFICAR ESTADO DE LA CLASE =====
    verificarEstado: function(claseId, claseNombre = '', fechaClase = null) {
        const horario = this.obtenerHorario(claseId, claseNombre, fechaClase);
        const ahora = Date.now();
        
        // Verificar diferentes estados
        if (ahora < horario.timestampApertura) {
            const dias = Math.ceil((horario.timestampApertura - ahora) / (1000 * 60 * 60 * 24));
            return {
                abierta: false,
                estado: 'proximamente',
                mensaje: `📅 La inscripción abrirá el ${horario.textoApertura} (faltan ${dias} días)`,
                horario: horario,
                tiempoRestante: horario.timestampApertura - ahora
            };
        }
        
        if (ahora > horario.timestampCierre) {
            return {
                abierta: false,
                estado: 'cerrada',
                mensaje: `🔒 La inscripción cerró el ${horario.textoCierre}`,
                horario: horario
            };
        }
        
        // Está abierta
        const minutosRestantes = Math.floor((horario.timestampCierre - ahora) / (1000 * 60));
        return {
            abierta: true,
            estado: 'abierta',
            mensaje: `✅ Inscripción abierta - Cierra en ${minutosRestantes} minutos`,
            horario: horario,
            minutosRestantes: minutosRestantes
        };
    },

    // ===== FORMATEAR FECHA PARA MOSTRAR =====
    formatearFecha: function(timestamp) {
        const fecha = new Date(timestamp);
        return fecha.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
};

// Exponer globalmente
window.HORARIOS_CONFIG = HORARIOS_CONFIG;