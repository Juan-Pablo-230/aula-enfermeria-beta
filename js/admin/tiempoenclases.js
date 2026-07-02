// ============================================
// tiempoenclases.js - VERSIÓN CON FILTROS
// ============================================

console.log('⏱️ tiempoenclases.js - Versión con filtros');

class TiempoEnClasesManager {
    constructor() {
        this.data = [];
        this.registrosAgrupados = [];
        this.filtros = {
            clase: 'todas',
            usuario: ''
        };
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando gestor de tiempos con filtros...');
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
            
            this.actualizarFiltrosClase();
            this.mostrarTabla();
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.mostrarError();
        }
    }

    agruparRegistros() {
    const grupos = new Map();
    
    this.data.forEach(reg => {
        // ✅ Obtener datos del usuario desde el lookup
        const usuario = reg.usuario || {};
        const usuarioId = reg.usuarioId;
        
        const key = `${usuarioId}_${reg.claseId}`;
        
        if (!grupos.has(key)) {
            grupos.set(key, {
                usuarioId: usuarioId,
                usuarioNombre: usuario.apellidoNombre || 'N/A',
                legajo: usuario.legajo || '-',
                turno: usuario.turno || 'No especificado',
                claseId: reg.claseId,
                claseNombre: reg.claseId, // Temporal, se mostrará como ID
                tiempoActivo: 0,
                tiempoInactivo: 0,
                ultimaActualizacion: reg.ultimaActualizacion || reg.fechaInicio,
                cantidadRegistros: 0
            });
        }
        
        const grupo = grupos.get(key);
        grupo.tiempoActivo += reg.tiempoActivo || 0;
        grupo.tiempoInactivo += reg.tiempoInactivo || 0;
        grupo.cantidadRegistros++;
        
        const fechaReg = new Date(reg.ultimaActualizacion || reg.fechaInicio);
        const fechaGrupo = new Date(grupo.ultimaActualizacion);
        if (fechaReg > fechaGrupo) {
            grupo.ultimaActualizacion = reg.ultimaActualizacion || reg.fechaInicio;
        }
    });
    
    this.registrosAgrupados = Array.from(grupos.values())
        .sort((a, b) => new Date(b.ultimaActualizacion) - new Date(a.ultimaActualizacion));
    
    console.log('📊 Grupos creados:', this.registrosAgrupados.length);
}

    actualizarFiltrosClase() {
        const selectClase = document.getElementById('filtroClase');
        if (!selectClase) return;

        // Obtener clases únicas de los registros
        const clases = [...new Set(this.registrosAgrupados.map(r => r.claseNombre).filter(Boolean))];
        
        selectClase.innerHTML = '<option value="todas">📚 Todas las clases</option>';
        
        clases.sort().forEach(clase => {
            const option = document.createElement('option');
            option.value = clase;
            option.textContent = clase;
            if (clase === this.filtros.clase) option.selected = true;
            selectClase.appendChild(option);
        });
        
        console.log(`📋 ${clases.length} clases disponibles para filtrar`);
    }

    aplicarFiltros() {
        let datos = [...this.registrosAgrupados];
        
        // Filtrar por clase
        if (this.filtros.clase && this.filtros.clase !== 'todas') {
            datos = datos.filter(r => r.claseNombre === this.filtros.clase);
            console.log(`🔍 Filtrando por clase: "${this.filtros.clase}" - ${datos.length} registros`);
        }
        
        // Filtrar por usuario (búsqueda)
        if (this.filtros.usuario && this.filtros.usuario.trim() !== '') {
            const termino = this.filtros.usuario.toLowerCase().trim();
            datos = datos.filter(r => 
                r.usuarioNombre?.toLowerCase().includes(termino) ||
                r.legajo?.toString().includes(termino)
            );
            console.log(`🔍 Filtrando por usuario: "${termino}" - ${datos.length} registros`);
        }
        
        return datos;
    }

    mostrarTabla() {
    const tbody = document.getElementById('tiemposBody');
    if (!tbody) return;

    const datosFiltrados = this.aplicarFiltros();

    if (datosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-message">No hay registros de tiempo con los filtros aplicados</td></tr>`;
        return;
    }

    tbody.innerHTML = datosFiltrados.map((item, index) => {
        // ✅ Obtener datos del usuario (viene del lookup)
        const usuario = item.usuario || {};
        
        const activo = this.formatearTiempo(item.tiempoActivo);
        const inactivo = this.formatearTiempo(item.tiempoInactivo);
        const total = item.tiempoActivo + item.tiempoInactivo;
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td>
                <strong>${usuario.apellidoNombre || 'N/A'}</strong>
                <button class="btn-info btn-small" onclick="tiemposManager.verDetalle('${item.usuarioId}')" title="Ver detalle">📋</button>
            </td>
            <td>${usuario.legajo || '-'}</td>
            <td>${item.claseId}</td>
            <td><span class="tiempo-badge activo">🟢 ${activo}</span></td>
            <td><span class="tiempo-badge inactivo">⚪ ${inactivo}</span></td>
            <td><span class="tiempo-badge total">📊 ${this.formatearTiempo(total)}</span></td>
        </tr>
    `}).join('');
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

    async cargarEstadisticas() {
        try {
            const datosFiltrados = this.aplicarFiltros();
            
            const totalRegistros = datosFiltrados.length;
            const usuariosUnicos = new Set(datosFiltrados.map(r => r.usuarioId)).size;
            const clasesUnicas = new Set(datosFiltrados.map(r => r.claseId)).size;
            
            const totalActivo = datosFiltrados.reduce((sum, r) => sum + (r.tiempoActivo || 0), 0);
            const totalInactivo = datosFiltrados.reduce((sum, r) => sum + (r.tiempoInactivo || 0), 0);
            const totalGeneral = totalActivo + totalInactivo;
            
            document.getElementById('totalRegistros').textContent = totalRegistros;
            document.getElementById('usuariosDistintos').textContent = usuariosUnicos;
            document.getElementById('clasesDistintas').textContent = clasesUnicas;
            document.getElementById('tiempoTotal').textContent = this.formatearTiempo(totalGeneral);
            
        } catch (error) {
            console.error('Error calculando estadísticas:', error);
        }
    }

    async verDetalle(usuarioId) {
    try {
        // ✅ Ahora los registros ya tienen 'usuario' con los datos
        const registrosUsuario = this.data.filter(r => r.usuarioId === usuarioId);
        
        if (registrosUsuario.length === 0) {
            alert('No hay registros para este usuario');
            return;
        }
        
        // Obtener datos del usuario del primer registro (ya viene con lookup)
        const usuarioInfo = registrosUsuario[0]?.usuario || {};
        
        const totalActivo = registrosUsuario.reduce((sum, r) => sum + (r.tiempoActivo || 0), 0);
        const totalInactivo = registrosUsuario.reduce((sum, r) => sum + (r.tiempoInactivo || 0), 0);
        
        // Agrupar por clase
        const clasesMap = new Map();
        registrosUsuario.forEach(reg => {
            const key = reg.claseId;
            if (!clasesMap.has(key)) {
                clasesMap.set(key, {
                    claseId: reg.claseId,
                    claseNombre: reg.claseId, // Temporal
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
                <h3>${usuarioInfo.apellidoNombre || 'Usuario'}</h3>
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
                            <strong>Clase ID: ${clase.claseId}</strong>
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
        // Filtro de clase
        document.getElementById('filtroClase')?.addEventListener('change', (e) => {
            this.filtros.clase = e.target.value;
            this.mostrarTabla();
            this.cargarEstadisticas();
        });
        
        // Filtro de usuario (con debounce)
        const filtroUsuario = document.getElementById('filtroUsuario');
        if (filtroUsuario) {
            let timeout;
            filtroUsuario.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filtros.usuario = e.target.value;
                    this.mostrarTabla();
                    this.cargarEstadisticas();
                }, 500);
            });
        }
        
        // Botón refrescar
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