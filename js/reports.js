// /js/reports.js
console.log('📋 reports.js cargado');

class ReportsManager {
    constructor() {
        this.reports = [];
        this.filtros = {
            estado: 'todos',
            usuario: '',
            desde: '',
            hasta: ''
        };
        this.init();
    }

    async init() {
        // Verificar autenticación y permisos
        if (!authSystem.isLoggedIn()) {
            window.location.href = '/index.html';
            return;
        }
        
        const user = authSystem.getCurrentUser();
        if (user.role !== 'admin' && user.role !== 'advanced') {
            alert('No tienes permisos para acceder a esta sección');
            window.location.href = '/index.html';
            return;
        }
        
        await this.cargarReportes();
        this.setupEventListeners();
    }

    async cargarReportes() {
        const container = document.getElementById('reportsList');
        container.innerHTML = '<div class="loading-message">Cargando reportes...</div>';
        
        try {
            let url = '/api/reports?limit=100';
            if (this.filtros.estado && this.filtros.estado !== 'todos') {
                url += `&estado=${this.filtros.estado}`;
            }
            if (this.filtros.desde) url += `&from=${this.filtros.desde}`;
            if (this.filtros.hasta) url += `&to=${this.filtros.hasta}`;
            
            const result = await authSystem.makeRequest(url, null, 'GET');
            
            if (result.success && result.data) {
                this.reports = result.data;
                this.actualizarEstadisticas(result.estadisticas);
                this.mostrarReportes();
            } else {
                container.innerHTML = '<div class="empty-message">No hay reportes para mostrar</div>';
            }
        } catch (error) {
            console.error('Error cargando reportes:', error);
            container.innerHTML = '<div class="error-message">Error al cargar los reportes</div>';
        }
    }

    actualizarEstadisticas(estadisticas) {
        if (!estadisticas) return;
        
        document.getElementById('statTotal').textContent = estadisticas.total || 0;
        document.getElementById('statPendientes').textContent = estadisticas.pendientes || 0;
        document.getElementById('statEnRevision').textContent = estadisticas.en_revision || 0;
        document.getElementById('statResueltos').textContent = estadisticas.resueltos || 0;
    }

    mostrarReportes() {
        const container = document.getElementById('reportsList');
        
        if (this.reports.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay reportes para mostrar</div>';
            return;
        }
        
        // Filtrar por usuario si hay búsqueda
        let reportsFiltrados = this.reports;
        if (this.filtros.usuario) {
            const termino = this.filtros.usuario.toLowerCase();
            reportsFiltrados = reportsFiltrados.filter(r => 
                r.usuario?.nombre?.toLowerCase().includes(termino) ||
                r.usuario?.legajo?.toString().includes(termino) ||
                r.usuario?.email?.toLowerCase().includes(termino)
            );
        }
        
        container.innerHTML = reportsFiltrados.map(reporte => {
            const fecha = new Date(reporte.fechaCreacion).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const estadoClass = reporte.estado || 'pendiente';
            const estadoTexto = {
                'pendiente': 'Pendiente',
                'en_revision': 'En Revisión',
                'resuelto': 'Resuelto',
                'cerrado': 'Cerrado'
            }[estadoClass] || 'Pendiente';
            
            return `
                <div class="report-card ${estadoClass}" data-id="${reporte._id}">
                    <div class="report-header">
                        <span class="report-title">${this.escapeHtml(reporte.title)}</span>
                        <span class="report-estado ${estadoClass}">${estadoTexto}</span>
                    </div>
                    <div class="report-info">
                        <span>👤 ${this.escapeHtml(reporte.usuario?.nombre || 'N/A')}</span>
                        <span>📋 Legajo: ${reporte.usuario?.legajo || 'N/A'}</span>
                        <span>📅 ${fecha}</span>
                    </div>
                    <div class="report-description">
                        ${this.escapeHtml(reporte.description.substring(0, 150))}${reporte.description.length > 150 ? '...' : ''}
                    </div>
                    <div class="report-footer">
                        <span>🔗 ${this.escapeHtml(reporte.url || 'URL no disponible')}</span>
                        ${reporte.includeLogs ? '<span>📊 Incluye logs</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.report-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.verDetalleReporte(id);
            });
        });
    }

    async verDetalleReporte(id) {
        try {
            const result = await authSystem.makeRequest(`/reports/${id}`, null, 'GET');
            
            if (result.success && result.data) {
                this.mostrarModalDetalle(result.data, result.browserLogs);
            }
        } catch (error) {
            console.error('Error cargando detalle:', error);
            alert('Error al cargar el detalle del reporte');
        }
    }

    mostrarModalDetalle(reporte, browserLogs = []) {
        const modal = document.getElementById('reporteModal');
        const content = document.getElementById('reporteModalContent');
        const title = document.getElementById('modalTitle');
        
        const fecha = new Date(reporte.fechaCreacion).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const estadoClass = reporte.estado || 'pendiente';
        const estadoTexto = {
            'pendiente': 'Pendiente',
            'en_revision': 'En Revisión',
            'resuelto': 'Resuelto',
            'cerrado': 'Cerrado'
        }[estadoClass] || 'Pendiente';
        
        // Generar HTML de logs
        let logsHTML = '';
        if (reporte.includeLogs && reporte.logs && reporte.logs.length > 0) {
            logsHTML = `
                <div class="logs-section">
                    <h4>📝 Logs del navegador (al momento del reporte)</h4>
                    <div class="logs-container">
                        ${reporte.logs.map(log => `
                            <div class="log-entry ${log.level}">
                                [${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${this.escapeHtml(log.message.substring(0, 200))}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Generar HTML de logs del sistema
        let browserLogsHTML = '';
        if (browserLogs && browserLogs.length > 0) {
            browserLogsHTML = `
                <div class="logs-section">
                    <h4>🌐 Logs del sistema (historial completo)</h4>
                    <div class="logs-container">
                        <select id="logsFilter" class="filtro-select" style="margin-bottom: 10px;">
                            <option value="todos">Todos los niveles</option>
                            <option value="error">Solo errores</option>
                            <option value="warn">Solo advertencias</option>
                            <option value="info">Solo información</option>
                        </select>
                        <div id="browserLogsList">
                            ${browserLogs.map(log => `
                                <div class="log-entry ${log.level}" data-level="${log.level}">
                                    [${new Date(log.serverTimestamp || log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${this.escapeHtml(log.message?.substring(0, 200) || '')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        title.textContent = `📋 ${this.escapeHtml(reporte.title)}`;
        
        content.innerHTML = `
            <div class="reporte-detalle">
                <div class="detalle-info">
                    <div class="info-row">
                        <strong>👤 Usuario:</strong> ${this.escapeHtml(reporte.usuario?.nombre || 'N/A')}
                    </div>
                    <div class="info-row">
                        <strong>📋 Legajo:</strong> ${reporte.usuario?.legajo || 'N/A'}
                    </div>
                    <div class="info-row">
                        <strong>📧 Email:</strong> ${this.escapeHtml(reporte.usuario?.email || 'N/A')}
                    </div>
                    <div class="info-row">
                        <strong>⏰ Turno:</strong> ${reporte.usuario?.turno || 'N/A'}
                    </div>
                    <div class="info-row">
                        <strong>🏥 Área:</strong> ${reporte.usuario?.area || 'N/A'}
                    </div>
                    <div class="info-row">
                        <strong>📅 Fecha:</strong> ${fecha}
                    </div>
                    <div class="info-row">
                        <strong>🔗 URL:</strong> <a href="${reporte.url}" target="_blank">${this.escapeHtml(reporte.url || 'N/A')}</a>
                    </div>
                    <div class="info-row">
                        <strong>🖥️ User Agent:</strong> <small>${this.escapeHtml(reporte.userAgent || 'N/A')}</small>
                    </div>
                    <div class="info-row">
                        <strong>🌐 IP:</strong> ${reporte.ip || 'N/A'}
                    </div>
                </div>
                
                <div class="detalle-descripcion">
                    <h4>📝 Descripción del problema</h4>
                    <p>${this.escapeHtml(reporte.description)}</p>
                </div>
                
                ${reporte.steps ? `
                <div class="detalle-pasos">
                    <h4>🔁 Pasos para reproducir</h4>
                    <p>${this.escapeHtml(reporte.steps).replace(/\n/g, '<br>')}</p>
                </div>
                ` : ''}
                
                <div class="detalle-estado">
                    <h4>📊 Estado del reporte</h4>
                    <div class="estado-selector">
                        <button class="estado-btn pendiente ${reporte.estado === 'pendiente' ? 'active' : ''}" data-estado="pendiente">🟡 Pendiente</button>
                        <button class="estado-btn en_revision ${reporte.estado === 'en_revision' ? 'active' : ''}" data-estado="en_revision">🔵 En Revisión</button>
                        <button class="estado-btn resuelto ${reporte.estado === 'resuelto' ? 'active' : ''}" data-estado="resuelto">🟢 Resuelto</button>
                        <button class="estado-btn cerrado ${reporte.estado === 'cerrado' ? 'active' : ''}" data-estado="cerrado">⚪ Cerrado</button>
                    </div>
                    <div class="comentario-group" style="margin-top: 15px;">
                        <label for="comentarioReporte">Comentario (opcional):</label>
                        <textarea id="comentarioReporte" rows="2" class="form-control" placeholder="Agregar un comentario sobre este reporte..."></textarea>
                    </div>
                    <button id="btnActualizarEstado" class="btn-submit" style="margin-top: 10px;">💾 Actualizar estado</button>
                </div>
                
                ${logsHTML}
                ${browserLogsHTML}
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Configurar cambio de estado
        const estadoBtns = content.querySelectorAll('.estado-btn');
        estadoBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                estadoBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Configurar actualización de estado
        const updateBtn = document.getElementById('btnActualizarEstado');
        updateBtn.addEventListener('click', async () => {
            const activeBtn = content.querySelector('.estado-btn.active');
            const nuevoEstado = activeBtn.dataset.estado;
            const comentario = document.getElementById('comentarioReporte').value;
            
            await this.actualizarEstado(reporte._id, nuevoEstado, comentario);
        });
        
        // Configurar filtro de logs
        const logsFilter = document.getElementById('logsFilter');
        if (logsFilter) {
            logsFilter.addEventListener('change', () => {
                const nivel = logsFilter.value;
                const logEntries = content.querySelectorAll('#browserLogsList .log-entry');
                logEntries.forEach(entry => {
                    if (nivel === 'todos') {
                        entry.style.display = 'block';
                    } else {
                        entry.style.display = entry.classList.contains(nivel) ? 'block' : 'none';
                    }
                });
            });
        }
        
        // Cerrar modal
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    async actualizarEstado(id, nuevoEstado, comentario) {
        try {
            const result = await authSystem.makeRequest(`/reports/${id}/estado`, {
                estado: nuevoEstado,
                comentario: comentario
            }, 'PUT');
            
            if (result.success) {
                alert('✅ Estado actualizado correctamente');
                await this.cargarReportes();
                document.getElementById('reporteModal').style.display = 'none';
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            alert('❌ Error al actualizar el estado: ' + error.message);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        // Filtro de estado
        const filtroEstado = document.getElementById('filtroEstado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                this.filtros.estado = e.target.value;
                this.cargarReportes();
            });
        }
        
        // Filtro de usuario
        const filtroUsuario = document.getElementById('filtroUsuario');
        if (filtroUsuario) {
            let timeout;
            filtroUsuario.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filtros.usuario = e.target.value;
                    this.mostrarReportes();
                }, 500);
            });
        }
        
        // Filtro de fechas
        const filtroDesde = document.getElementById('filtroDesde');
        const filtroHasta = document.getElementById('filtroHasta');
        if (filtroDesde) {
            filtroDesde.addEventListener('change', (e) => {
                this.filtros.desde = e.target.value;
                this.cargarReportes();
            });
        }
        if (filtroHasta) {
            filtroHasta.addEventListener('change', (e) => {
                this.filtros.hasta = e.target.value;
                this.cargarReportes();
            });
        }
        
        // Botón refrescar
        const btnRefrescar = document.getElementById('btnRefrescar');
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', () => {
                this.cargarReportes();
            });
        }
        
        // Botón volver
        const btnVolver = document.getElementById('btnVolver');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                window.location.href = '/index.html';
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
});