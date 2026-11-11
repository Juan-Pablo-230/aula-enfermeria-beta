console.log('📊 Módulo de Estadísticas cargado');

class EstadisticasManager {
    constructor() {
        this.data = {
            kpis: {},
            series: { capacitaciones: [], material: [], usuarios: [], asistencias: [] },
            porServicio: [],
            porClase: [],
            comparativas: {}
        };
        this.filtros = {
            anio: new Date().getFullYear(),
            mes: 'todos',
            area: 'todas'
        };
        this.charts = {};
        this.clasesCache = [];
        this.mesesPorAnio = {};
        this.init();
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    async init() {
        try {
            await this.waitForAuth();
            await this.waitForArea();

            const hayPeriodos = await this.cargarPeriodosDisponibles();
            if (!hayPeriodos) return;

            this.poblarFiltros();
            this.setupEventListeners();
            await this.cargarTodo();

        } catch (error) {
            console.error('❌ Error inicializando estadísticas:', error);
            this.mostrarErrorGlobal(error.message);
        }
    }

    waitForAuth() {
        return new Promise((resolve, reject) => {
            const maxIntentos = 100;
            let intentos = 0;
            const check = () => {
                if (typeof authSystem !== 'undefined' && authSystem?.isLoggedIn?.()) {
                    console.log('✅ authSystem listo');
                    resolve();
                } else if (intentos++ < maxIntentos) {
                    setTimeout(check, 100);
                } else {
                    reject(new Error('authSystem no disponible o usuario no logueado'));
                }
            };
            check();
        });
    }

    waitForArea() {
        if (window.area && Object.keys(window.area).length > 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            let intentos = 0;
            const check = () => {
                if (window.area && Object.keys(window.area).length > 0) {
                    console.log('✅ window.area listo');
                    resolve();
                } else if (intentos++ < 30) {
                    setTimeout(check, 100);
                } else {
                    console.warn('⚠️ Timeout esperando window.area');
                    resolve();
                }
            };
            check();
        });
    }

    // ============================================================
    // PERÍODOS DISPONIBLES (años y meses con datos reales)
    // ============================================================
    async cargarPeriodosDisponibles() {
        try {
            const result = await authSystem.makeRequest(
                '/admin/estadisticas/periodos',
                null,
                'GET'
            );

            if (!result || !result.success) {
                throw new Error(result?.message || 'No se pudieron cargar los períodos');
            }

            const { anios = [], mesesPorAnio = {} } = result.data || {};

            console.log('📅 Períodos recibidos del backend:', { anios, mesesPorAnio });

            if (anios.length === 0) {
                this.mostrarAvisoSinDatos();
                return false;
            }

            const anioSelect = document.getElementById('filtroAnio');
            if (anioSelect) {
                anioSelect.innerHTML = '';
                anios.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a;
                    opt.textContent = a;
                    anioSelect.appendChild(opt);
                });
                this.filtros.anio = anios[0];
                anioSelect.value = anios[0];
            }

            this.mesesPorAnio = mesesPorAnio;
            this.poblarMesesDelAnio(anios[0]);

            console.log(`✅ Períodos cargados: ${anios.length} años`);
            return true;

        } catch (error) {
            console.error('❌ Error cargando períodos:', error);
            this.mostrarErrorGlobal('Error al cargar los períodos disponibles: ' + error.message);
            return false;
        }
    }

    poblarMesesDelAnio(anio) {
        const mesSelect = document.getElementById('filtroMes');
        if (!mesSelect) return;

        const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const meses = (this.mesesPorAnio && this.mesesPorAnio[anio]) || [];

        mesSelect.innerHTML = '<option value="todos">Todos los meses</option>';

        if (meses.length === 0) {
            mesSelect.innerHTML += '<option value="" disabled>Sin datos</option>';
            return;
        }

        meses.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = nombresMeses[m] || `Mes ${m + 1}`;
            mesSelect.appendChild(opt);
        });

        this.filtros.mes = 'todos';
        mesSelect.value = 'todos';
    }

    mostrarAvisoSinDatos() {
        const container = document.getElementById('statsError') || document.body;
        const div = document.createElement('div');
        div.className = 'error-panel';
        div.innerHTML = `
            <h3>📭 No hay datos disponibles</h3>
            <p>Todavía no se registraron capacitaciones, asistencias, solicitudes de material ni usuarios.</p>
            <p>Los filtros de año y mes se poblarán automáticamente cuando existan datos.</p>
        `;
        container.innerHTML = '';
        container.appendChild(div);

        ['filtroAnio', 'filtroMes', 'filtroArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    }

    // ============================================================
    // POBLAR FILTRO DE ÁREAS (años/meses ya vienen del backend)
    // ============================================================
    poblarFiltros() {
        const areaSelect = document.getElementById('filtroArea');
        if (!areaSelect) return;

        areaSelect.innerHTML = '<option value="todas">Todas las áreas</option>';

        if (window.area && typeof window.area === 'object' && Object.keys(window.area).length > 0) {
            const areasUnicas = new Set();
            Object.values(window.area).forEach(categoria => {
                if (Array.isArray(categoria)) {
                    categoria.forEach(a => {
                        if (a && typeof a === 'string') areasUnicas.add(a);
                    });
                }
            });

            Array.from(areasUnicas).sort((a, b) => a.localeCompare(b)).forEach(a => {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                areaSelect.appendChild(opt);
            });

            console.log(`✅ ${areasUnicas.size} áreas cargadas`);
        } else {
            console.warn('⚠️ window.area no disponible');
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    setupEventListeners() {
        // Listener para el select de AÑO: repobla meses + recarga
        const anioSelect = document.getElementById('filtroAnio');
        if (anioSelect) {
            anioSelect.addEventListener('change', (e) => {
                const nuevoAnio = parseInt(e.target.value);
                this.filtros.anio = nuevoAnio;
                this.poblarMesesDelAnio(nuevoAnio);
                this.cargarTodo();
            });
        }

        // Listener para el select de MES: solo recarga
        const mesSelect = document.getElementById('filtroMes');
        if (mesSelect) {
            mesSelect.addEventListener('change', (e) => {
                this.filtros.mes = e.target.value;
                this.cargarTodo();
            });
        }

        // Listener para el select de ÁREA: solo recarga
        const areaSelect = document.getElementById('filtroArea');
        if (areaSelect) {
            areaSelect.addEventListener('change', (e) => {
                this.filtros.area = e.target.value;
                this.cargarTodo();
            });
        }

        // Botones
        document.getElementById('btnActualizarStats')?.addEventListener('click', () => this.cargarTodo());
        document.getElementById('btnExportarStats')?.addEventListener('click', () => this.exportarCSV());

        // Buscador de clases
        document.getElementById('buscarClaseStats')?.addEventListener('input', (e) => {
            this.filtrarTablaClases(e.target.value);
        });
    }

    // ============================================================
    // CARGA PRINCIPAL DE DATOS
    // ============================================================
    async cargarTodo() {
        try {
            console.log('📥 Cargando estadísticas con filtros:', this.filtros);

            const params = new URLSearchParams({
                anio: this.filtros.anio,
                mes: this.filtros.mes,
                area: this.filtros.area
            });

            const result = await authSystem.makeRequest(
                `/admin/estadisticas?${params.toString()}`,
                null,
                'GET'
            );

            if (!result || !result.success) {
                throw new Error(result?.message || 'Respuesta inválida del servidor');
            }

            this.data = result.data || {};

            this.safeRender('KPIs', () => this.renderKPIs(this.data.kpis));
            this.safeRender('Gráficos', () => this.renderGraficos(this.data.series));
            this.safeRender('Tabla Servicios', () => this.renderTablaServicios(this.data.porServicio));
            this.safeRender('Tabla Clases', () => this.renderTablaClases(this.data.porClase));
            this.safeRender('Comparativas', () => this.renderComparativas(this.data.comparativas));

            console.log('✅ Estadísticas cargadas y renderizadas');

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            this.mostrarErrorGlobal('Error al cargar estadísticas: ' + (error.message || 'Error desconocido'));
        }
    }

    safeRender(nombre, fn) {
        try {
            fn();
        } catch (e) {
            console.error(`❌ Error en ${nombre}:`, e);
        }
    }

    // ============================================================
    // KPIs + COMPARATIVA
    // ============================================================
    renderKPIs(kpis) {
        if (!kpis) return;

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? '0';
        };

        setText('kpiCapacitaciones', kpis.capacitaciones?.actual);
        setText('kpiMaterial', kpis.material?.actual);
        setText('kpiUsuarios', kpis.usuarios?.actual);
        setText('kpiAsistencias', kpis.asistencias?.actual);

        this.renderComparativa('cmpCapacitaciones', kpis.capacitaciones);
        this.renderComparativa('cmpMaterial', kpis.material);
        this.renderComparativa('cmpUsuarios', kpis.usuarios);
        this.renderComparativa('cmpAsistencias', kpis.asistencias);
    }

    renderComparativa(elId, data) {
        const el = document.getElementById(elId);
        if (!el) return;

        if (!data) {
            el.innerHTML = '<span class="cmp-neutral">— Sin datos</span>';
            return;
        }

        const { actual = 0, anterior = 0, porcentaje = 0 } = data;

        if (anterior === 0 && actual === 0) {
            el.innerHTML = '<span class="cmp-neutral">— Sin datos previos</span>';
            return;
        }

        const flecha = porcentaje > 0 ? '▲' : porcentaje < 0 ? '▼' : '●';
        const clase = porcentaje > 0 ? 'cmp-up' : porcentaje < 0 ? 'cmp-down' : 'cmp-equal';
        const signo = porcentaje > 0 ? '+' : '';

        el.innerHTML = `
            <span class="${clase}">
                ${flecha} ${signo}${Number(porcentaje).toFixed(1)}%
            </span>
            <small>vs período anterior (${anterior})</small>
        `;
    }

    // ============================================================
    // GRÁFICOS (Chart.js)
    // ============================================================
    renderGraficos(series) {
        if (!series) return;

        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js no está cargado, omitiendo gráficos');
            return;
        }

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                       'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        this.crearGrafico('chartCapacitaciones', meses, series.capacitaciones || [], '#4285f4', 'Capacitaciones');
        this.crearGrafico('chartMaterial', meses, series.material || [], '#34a853', 'Material solicitado');
        this.crearGrafico('chartUsuarios', meses, series.usuarios || [], '#f9ab00', 'Usuarios nuevos');
        this.crearGrafico('chartAsistencias', meses, series.asistencias || [], '#9c27b0', 'Asistencias');
    }

    crearGrafico(canvasId, labels, data, color, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: color + '99',
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }

    // ============================================================
    // TABLA DE SERVICIOS / ÁREAS
    // ============================================================
    renderTablaServicios(servicios) {
        const tbody = document.querySelector('#tablaServicios tbody');
        if (!tbody) return;

        if (!servicios || servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Sin datos</td></tr>';
            return;
        }

        tbody.innerHTML = servicios.map(s => `
            <tr>
                <td><strong>${s.area || 'Sin área'}</strong></td>
                <td>${s.capacitaciones || 0}</td>
                <td>${s.asistencias || 0}</td>
                <td>${s.usuariosUnicos || 0}</td>
                <td>${s.material || 0}</td>
            </tr>
        `).join('');

        const canvas = document.getElementById('chartServicios');
        if (canvas && typeof Chart !== 'undefined') {
            if (this.charts.chartServicios) this.charts.chartServicios.destroy();

            this.charts.chartServicios = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: servicios.map(s => s.area || 'Sin área'),
                    datasets: [{
                        label: 'Asistencias',
                        data: servicios.map(s => s.asistencias || 0),
                        backgroundColor: '#4285f499',
                        borderColor: '#4285f4',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        }
    }

    // ============================================================
    // TABLA DE CLASES INDIVIDUALES
    // ============================================================
    renderTablaClases(clases) {
        this.clasesCache = Array.isArray(clases) ? clases : [];
        this.filtrarTablaClases('');
    }

    filtrarTablaClases(termino) {
        const tbody = document.querySelector('#tablaClases tbody');
        if (!tbody) return;

        let clases = [...(this.clasesCache || [])];

        if (termino && termino.trim()) {
            const t = termino.toLowerCase().trim();
            clases = clases.filter(c =>
                (c.nombre || '').toLowerCase().includes(t) ||
                (c.area || '').toLowerCase().includes(t)
            );
        }

        if (clases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Sin clases para mostrar</td></tr>';
            return;
        }

        tbody.innerHTML = clases.map((c, i) => {
            const fecha = c.fecha
                ? new Date(c.fecha).toLocaleDateString('es-AR')
                : 'N/A';

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${c.nombre || 'N/A'}</strong></td>
                    <td>${fecha}</td>
                    <td>${c.area || 'Todas'}</td>
                    <td>${c.inscriptos || 0}</td>
                    <td>${c.asistencias || 0}</td>
                    <td>${c.material || 0}</td>
                </tr>
            `;
        }).join('');
    }

    // ============================================================
    // COMPARATIVAS HISTÓRICAS
    // ============================================================
    renderComparativas(cmp) {
        if (!cmp) return;

        const render = (elId, datos) => {
            const el = document.getElementById(elId);
            if (!el) return;

            if (!datos) {
                el.innerHTML = '<p class="empty-message">Sin datos</p>';
                return;
            }

            el.innerHTML = `
                <div class="cmp-row">
                    <span>🎓 Capacitaciones:</span>
                    <strong>${datos.capacitaciones || 0}</strong>
                </div>
                <div class="cmp-row">
                    <span>✅ Asistencias:</span>
                    <strong>${datos.asistencias || 0}</strong>
                </div>
                <div class="cmp-row">
                    <span>📚 Material:</span>
                    <strong>${datos.material || 0}</strong>
                </div>
                <div class="cmp-row">
                    <span>👥 Usuarios nuevos:</span>
                    <strong>${datos.usuarios || 0}</strong>
                </div>
            `;
        };

        render('cmpAnioAnterior', cmp.anioAnterior);
        render('cmpMesAnterior', cmp.mesAnterior);
        render('cmpPromedio', cmp.promedio);
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    mostrarErrorGlobal(mensaje) {
        console.error('❌', mensaje);

        const container = document.getElementById('statsError');
        if (container) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="error-panel">
                    <h3>⚠️ Error al cargar estadísticas</h3>
                    <p>${this.escapeHtml(mensaje)}</p>
                    <button onclick="window.estadisticasManager.cargarTodo()" class="btn btn-primary">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        } else {
            console.warn('(Sin contenedor #statsError, mensaje solo en consola)');
        }
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // ============================================================
    // EXPORTAR CSV
    // ============================================================
    exportarCSV() {
        try {
            const filas = [];

            // KPIs
            filas.push(['=== KPIs PRINCIPALES ===']);
            filas.push(['Métrica', 'Actual', 'Anterior', '% Cambio']);
            const k = this.data.kpis || {};
            filas.push(['Capacitaciones', k.capacitaciones?.actual ?? 0, k.capacitaciones?.anterior ?? 0, `${Number(k.capacitaciones?.porcentaje ?? 0).toFixed(1)}%`]);
            filas.push(['Material solicitado', k.material?.actual ?? 0, k.material?.anterior ?? 0, `${Number(k.material?.porcentaje ?? 0).toFixed(1)}%`]);
            filas.push(['Usuarios', k.usuarios?.actual ?? 0, k.usuarios?.anterior ?? 0, `${Number(k.usuarios?.porcentaje ?? 0).toFixed(1)}%`]);
            filas.push(['Asistencias', k.asistencias?.actual ?? 0, k.asistencias?.anterior ?? 0, `${Number(k.asistencias?.porcentaje ?? 0).toFixed(1)}%`]);
            filas.push([]);

            // Servicios
            filas.push(['=== POR SERVICIO / ÁREA ===']);
            filas.push(['Área', 'Capacitaciones', 'Asistencias', 'Usuarios únicos', 'Material']);
            (this.data.porServicio || []).forEach(s => {
                filas.push([
                    s.area || 'Sin área',
                    s.capacitaciones || 0,
                    s.asistencias || 0,
                    s.usuariosUnicos || 0,
                    s.material || 0
                ]);
            });
            filas.push([]);

            // Clases
            filas.push(['=== POR CLASE ===']);
            filas.push(['Clase', 'Fecha', 'Área', 'Inscriptos', 'Asistencias', 'Material']);
            (this.data.porClase || []).forEach(c => {
                filas.push([
                    c.nombre || 'N/A',
                    c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : 'N/A',
                    c.area || 'Todas',
                    c.inscriptos || 0,
                    c.asistencias || 0,
                    c.material || 0
                ]);
            });

            const csv = filas
                .map(fila => fila.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estadisticas_${this.filtros.anio}_${this.filtros.mes}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);

            console.log('✅ CSV exportado');
        } catch (error) {
            console.error('❌ Error exportando CSV:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.estadisticasManager = new EstadisticasManager();
});