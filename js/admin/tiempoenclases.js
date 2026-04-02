// ============================================
// tiempoenclases.js - VERSIÓN CORREGIDA (agrupa por usuario/clase)
// ============================================

console.log('⏱️ tiempoenclases.js - Versión CORREGIDA');

class TiempoEnClasesManager {
    constructor() {
        this.data = [];
        this.registrosAgrupados = [];
        this.filtros = {
            clase: 'todas',
            periodo: 'todo',
            usuario: ''
        };
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando gestor de tiempos CORREGIDO...');
        await this.cargarDatos();
        this.setupEventListeners();
        this.cargarEstadisticas();
    }

    async cargarDatos() {
        try {
            console.log('📥 Cargando registros de tiempo desde MongoDB...');
            const result = await authSystem.makeRequest('/tiempo-clase', null, 'GET');
            
            if (result.success && result.data) {
                this.data = result.data;
                console.log(`✅ ${this.data.length} registros crudos cargados`);
                
                // AGRUPAR POR USUARIO Y CLASE
                this.agruparRegistros();
                console.log(`📊 ${this.registrosAgrupados.length} registros agrupados`);
            } else {
                this.data = [];
                this.registrosAgrupados = [];
            }
            
            this.mostrarTabla();
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.mostrarError();
        }
    }

    agruparRegistros() {
        const grupos = new Map(); // Usamos Map para mejor rendimiento
        
        this.data.forEach(reg => {
            // Crear una clave única: usuarioId_claseId
            const key = `${reg.usuarioId}_${reg.claseId}`;
            
            if (!grupos.has(key)) {
                // Nuevo grupo
                grupos.set(key, {
                    usuarioId: reg.usuarioId,
                    usuarioNombre: reg.usuarioNombre,
                    legajo: reg.legajo,
                    turno: reg.turno,
                    claseId: reg.claseId,
                    claseNombre: reg.claseNombre,
                    tiempoActivo: 0,
                    tiempoInactivo: 0,
                    ultimaActualizacion: reg.ultimaActualizacion || reg.fechaRegistro,
                    cantidadRegistros: 0
                });
            }
            
            // Sumar los tiempos al grupo existente
            const grupo = grupos.get(key);
            grupo.tiempoActivo += reg.tiempoActivo || 0;
            grupo.tiempoInactivo += reg.tiempoInactivo || 0;
            grupo.cantidadRegistros++;
            
            // Actualizar última fecha si es más reciente
            const fechaReg = new Date(reg.ultimaActualizacion || reg.fechaRegistro);
            const fechaGrupo = new Date(grupo.ultimaActualizacion);
            if (fechaReg > fechaGrupo) {
                grupo.ultimaActualizacion = reg.ultimaActualizacion || reg.fechaRegistro;
            }
        });
        
        // Convertir Map a array y ordenar
        this.registrosAgrupados = Array.from(grupos.values())
            .sort((a, b) => new Date(b.ultimaActualizacion) - new Date(a.ultimaActualizacion));
        
        console.log('📊 Muestra de grupos:', this.registrosAgrupados.slice(0, 3));
    }

    async cargarEstadisticas() {
        try {
            // Calcular estadísticas desde los datos agrupados
            const totalRegistros = this.registrosAgrupados.length;
            const usuariosUnicos = new Set(this.registrosAgrupados.map(r => r.usuarioId)).size;
            const clasesUnicas = new Set(this.registrosAgrupados.map(r => r.claseId)).size;
            
            const totalActivo = this.registrosAgrupados.reduce((sum, r) => sum + (r.tiempoActivo || 0), 0);
            const totalInactivo = this.registrosAgrupados.reduce((sum, r) => sum + (r.tiempoInactivo || 0), 0);
            const totalGeneral = totalActivo + totalInactivo;
            
            document.getElementById('totalRegistros').textContent = totalRegistros;
            document.getElementById('usuariosDistintos').textContent = usuariosUnicos;
            document.getElementById('clasesDistintas').textContent = clasesUnicas;
            document.getElementById('tiempoTotal').textContent = this.formatearTiempo(totalGeneral);
            
            console.log('📊 Estadísticas calculadas:', {
                registros: totalRegistros,
                usuarios: usuariosUnicos,
                clases: clasesUnicas,
                activo: this.formatearTiempo(totalActivo),
                inactivo: this.formatearTiempo(totalInactivo),
                total: this.formatearTiempo(totalGeneral)
            });
            
        } catch (error) {
            console.error('Error calculando estadísticas:', error);
        }
    }

    formatearTiempo(segundos) {
        if (!segundos && segundos !== 0) return '0s';
        
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        if (horas > 0) return `${horas}h ${minutos}m`;
        if (minutos > 0) return `${minutos}m ${segs}s`;
        return `${segs}s`;
    }

    mostrarTabla() {
        const tbody = document.getElementById('tiemposBody');
        if (!tbody) return;

        if (this.registrosAgrupados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-message">No hay registros de tiempo</td></tr>`;
            return;
        }

        tbody.innerHTML = this.registrosAgrupados.map((item, index) => {
            const activo = this.formatearTiempo(item.tiempoActivo);
            const inactivo = this.formatearTiempo(item.tiempoInactivo);
            const total = item.tiempoActivo + item.tiempoInactivo;
            
            // Debug: mostrar los valores reales
            console.log(`👤 ${item.usuarioNombre} - Activo: ${item.tiempoActivo}s (${activo}), Inactivo: ${item.tiempoInactivo}s (${inactivo})`);
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${item.usuarioNombre}</strong>
                    <button class="btn-info btn-small" onclick="tiemposManager.verDetalle('${item.usuarioId}')" title="Ver detalle">📋</button>
                </td>
                <td>${item.legajo || '-'}</td>
                <td>${item.claseNombre}</td>
                <td><span class="tiempo-badge activo">🟢 ${activo}</span></td>
                <td><span class="tiempo-badge inactivo">⚪ ${inactivo}</span></td>
                <td><span class="tiempo-badge total">📊 ${this.formatearTiempo(total)}</span></td>
            </tr>
        `}).join('');
    }

    async verDetalle(usuarioId) {
        try {
            // Filtrar los registros de este usuario
            const registrosUsuario = this.data.filter(r => r.usuarioId === usuarioId);
            
            if (registrosUsuario.length === 0) {
                alert('No hay registros para este usuario');
                return;
            }
            
            // Obtener datos del usuario del primer registro
            const usuarioInfo = registrosUsuario[0];
            
            // Calcular totales
            const totalActivo = registrosUsuario.reduce((sum, r) => sum + (r.tiempoActivo || 0), 0);
            const totalInactivo = registrosUsuario.reduce((sum, r) => sum + (r.tiempoInactivo || 0), 0);
            
            // Agrupar por clase para el detalle
            const clasesMap = new Map();
            registrosUsuario.forEach(reg => {
                const key = reg.claseId;
                if (!clasesMap.has(key)) {
                    clasesMap.set(key, {
                        claseNombre: reg.claseNombre,
                        tiempoActivo: 0,
                        tiempoInactivo: 0,
                        registros: []
                    });
                }
                const clase = clasesMap.get(key);
                clase.tiempoActivo += reg.tiempoActivo || 0;
                clase.tiempoInactivo += reg.tiempoInactivo || 0;
                clase.registros.push(reg);
            });
            
            const contenido = `
                <div class="detalle-usuario">
                    <h3>${usuarioInfo.usuarioNombre}</h3>
                    <div class="detalle-info">
                        <p><strong>Legajo:</strong> ${usuarioInfo.legajo || '-'}</p>
                        <p><strong>Email:</strong> ${usuarioInfo.email || 'No disponible'}</p>
                        <p><strong>Turno:</strong> ${usuarioInfo.turno || 'No especificado'}</p>
                    </div>
                    
                    <div class="detalle-resumen">
                        <div class="resumen-card activo">
                            <span class="label">Tiempo Activo</span>
                            <span class="value">${this.formatearTiempo(totalActivo)}</span>
                        </div>
                        <div class="resumen-card inactivo">
                            <span class="label">Tiempo Inactivo</span>
                            <span class="value">${this.formatearTiempo(totalInactivo)}</span>
                        </div>
                        <div class="resumen-card total">
                            <span class="label">Tiempo Total</span>
                            <span class="value">${this.formatearTiempo(totalActivo + totalInactivo)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detalle-clases">
                    <h4>📋 Detalle por clase</h4>
                    ${Array.from(clasesMap.values()).map(clase => `
                        <div class="clase-item">
                            <div class="clase-header">
                                <strong>${clase.claseNombre}</strong>
                                <span class="badge">${clase.registros.length} sesiones</span>
                            </div>
                            <div class="clase-tiempos">
                                <span class="activo">🟢 Activo: ${this.formatearTiempo(clase.tiempoActivo)}</span>
                                <span class="inactivo">⚪ Inactivo: ${this.formatearTiempo(clase.tiempoInactivo)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('detalleModalContent').innerHTML = contenido;
            document.getElementById('detalleModal').style.display = 'flex';
            
        } catch (error) {
            console.error('❌ Error cargando detalle:', error);
            alert('Error al cargar detalle');
        }
    }

    mostrarError() {
        const tbody = document.getElementById('tiemposBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="error-message">⚠️ Error al cargar los datos</td></tr>`;
        }
    }

    setupEventListeners() {
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            console.log('🔄 Actualizando datos...');
            this.cargarDatos();
            this.cargarEstadisticas();
        });
        
        // Cerrar modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('detalleModal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('detalleModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.tiemposManager = new TiempoEnClasesManager();
});