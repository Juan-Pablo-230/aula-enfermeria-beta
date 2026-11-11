console.log('📊 Módulo de Estadísticas cargado');

class EstadisticasManager {
    constructor() {
        this.data = {
            capacitaciones: [],
            material: [],
            usuarios: [],
            asistencias: [],
            clases: [],
            servicios: []
        };
        this.filtros = {
            anio: new Date().getFullYear(),
            mes: 'todos',
            area: 'todas'
        };
        this.charts = {};
        this.init();
    }

    async init() {
        this.poblarFiltros();
        this.setupEventListeners();
        await this.cargarTodo();
    }

    poblarFiltros() {
        const anioSelect = document.getElementById('filtroAnio');
        const mesSelect = document.getElementById('filtroMes');
        const areaSelect = document.getElementById('filtroArea');
        const anioActual = new Date().getFullYear();

        // Años: 5 anteriores + actual + 1 siguiente
        for (let a = anioActual + 1; a >= anioActual - 5; a--) {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            if (a === anioActual) opt.selected = true;
            anioSelect.appendChild(opt);
        }

        // Meses
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                       'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        meses.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = m;
            mesSelect.appendChild(opt);
        });

        // Áreas (desde window.area)
        if (window.area) {
            const areasUnicas = new Set();
            Object.values(window.area).flat().forEach(a => areasUnicas.add(a));
            Array.from(areasUnicas).sort().forEach(a => {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                areaSelect.appendChild(opt);
            });
        }
    }

    setupEventListeners() {
        ['filtroAnio','filtroMes','filtroArea'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                this.filtros[id.replace('filtro','').toLowerCase()] = 
                    id === 'filtroAnio' ? parseInt(e.target.value) : e.target.value;
                this.cargarTodo();
            });
        });

        document.getElementById('btnActualizarStats')?.addEventListener('click', () => this.cargarTodo());
        document.getElementById('btnExportarStats')?.addEventListener('click', () => this.exportarCSV());
        document.getElementById('buscarClaseStats')?.addEventListener('input', (e) => {
            this.filtrarTablaClases(e.target.value);
        });
    }

    // ============================================================
    // CARGA DE DATOS (Todo desde el backend en una sola llamada)
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

            if (!result.success) throw new Error(result.message);

            this.data = result.data;
            this.renderKPIs(result.data.kpis);
            this.renderGraficos(result.data.series);
            this.renderTablaServicios(result.data.porServicio);
            this.renderTablaClases(result.data.porClase);
            this.renderComparativas(result.data.comparativas);

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            showMessage('Error al cargar estadísticas: ' + error.message, 'error');
        }
    }

    // ============================================================
    // KPIs CON COMPARATIVA
    // ============================================================
    renderKPIs(kpis) {
        document.getElementById('kpiCapacitaciones').textContent = kpis.capacitaciones.actual;
        document.getElementById('kpiMaterial').textContent = kpis.material.actual;
        document.getElementById('kpiUsuarios').textContent = kpis.usuarios.actual;
        document.getElementById('kpiAsistencias').textContent = kpis.asistencias.actual;

        this.renderComparativa('cmpCapacitaciones', kpis.capacitaciones);
        this.renderComparativa('cmpMaterial', kpis.material);
        this.renderComparativa('cmpUsuarios', kpis.usuarios);
        this.renderComparativa('cmpAsistencias', kpis.asistencias);
    }

    renderComparativa(elId, data) {
        const el = document.getElementById(elId);
        if (!el) return;

        const { actual, anterior, porcentaje } = data;
        if (anterior === 0 && actual === 0) {
            el.innerHTML = '<span class="cmp-neutral">— Sin datos previos</span>';
            return;
        }

        const flecha = porcentaje > 0 ? '▲' : porcentaje < 0 ? '▼' : '●';
        const clase = porcentaje > 0 ? 'cmp-up' : porcentaje < 0 ? 'cmp-down' : 'cmp-equal';
        const signo = porcentaje > 0 ? '+' : '';

        el.innerHTML = `
            <span class="${clase}">
                ${flecha} ${signo}${porcentaje.toFixed(1)}%
            </span>
            <small>vs período anterior (${anterior})</small>
        `;
    }

    // ============================================================
    // GRÁFICOS CON CHART.JS
    // ============================================================
    renderGraficos(series) {
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

        this.crearGrafico('chartCapacitaciones', meses, series.capacitaciones, '#4285f4');
        this.crearGrafico('chartMaterial', meses, series.material, '#34a853');
        this.crearGrafico('chartUsuarios', meses, series.usuarios, '#f9ab00');
        this.crearGrafico('chartAsistencias', meses, series.asistencias, '#9c27b0');
    }

    crearGrafico(canvasId, labels, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad',
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
                <td>${s.capacitaciones}</td>
                <td>${s.asistencias}</td>
                <td>${s.usuariosUnicos}</td>
                <td>${s.material}</td>
            </tr>
        `).join('');

        // Gráfico de servicios
        const ctx = document.getElementById('chartServicios');
        if (ctx) {
            if (this.charts.chartServicios) this.charts.chartServicios.destroy();
            this.charts.chartServicios = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: servicios.map(s => s.area || 'Sin área'),
                    datasets: [{
                        label: 'Asistencias',
                        data: servicios.map(s => s.asistencias),
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
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
    }

    // ============================================================
    // TABLA DE CLASES INDIVIDUALES
    // ============================================================
    renderTablaClases(clases) {
        this.clasesCache = clases || [];
        this.filtrarTablaClases('');
    }

    filtrarTablaClases(termino) {
        const tbody = document.querySelector('#tablaClases tbody');
        if (!tbody) return;

        let clases = this.clasesCache || [];
        if (termino) {
            const t = termino.toLowerCase();
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
            const fecha = c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : 'N/A';
            const pct = c.inscriptos > 0 
                ? ((c.asistencias / c.inscriptos) * 100).toFixed(1) 
                : '0.0';
            const pctClass = pct >= 80 ? 'pct-alto' : pct >= 50 ? 'pct-medio' : 'pct-bajo';

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${c.nombre || 'N/A'}</strong></td>
                    <td>${fecha}</td>
                    <td>${c.area || 'Todas'}</td>
                    <td>${c.inscriptos}</td>
                    <td>${c.asistencias}</td>
                    <td>${c.material || 0}</td>
                </tr>
            `;
        }).join('');
    }

    // ============================================================
    // COMPARATIVAS HISTÓRICAS
    // ============================================================
    renderComparativas(cmp) {
        const render = (elId, titulo, datos) => {
            const el = document.getElementById(elId);
            if (!el) return;

            el.innerHTML = `
                <div class="cmp-row">
                    <span>Capacitaciones:</span>
                    <strong>${datos.capacitaciones}</strong>
                </div>
                <div class="cmp-row">
                    <span>Asistencias:</span>
                    <strong>${datos.asistencias}</strong>
                </div>
                <div class="cmp-row">
                    <span>Material:</span>
                    <strong>${datos.material}</strong>
                </div>
                <div class="cmp-row">
                    <span>Usuarios nuevos:</span>
                    <strong>${datos.usuarios}</strong>
                </div>
            `;
        };

        render('cmpAnioAnterior', 'Año anterior', cmp.anioAnterior);
        render('cmpMesAnterior', 'Mes anterior', cmp.mesAnterior);
        render('cmpPromedio', 'Promedio histórico', cmp.promedio);
    }

    // ============================================================
    // EXPORTAR A CSV
    // ============================================================
    exportarCSV() {
        const filas = [];
        filas.push(['Tipo', 'Valor']);
        filas.push(['Capacitaciones', this.data.kpis?.capacitaciones?.actual || 0]);
        filas.push(['Material solicitado', this.data.kpis?.material?.actual || 0]);
        filas.push(['Usuarios', this.data.kpis?.usuarios?.actual || 0]);
        filas.push(['Asistencias', this.data.kpis?.asistencias?.actual || 0]);
        filas.push([]);
        filas.push(['Área', 'Capacitaciones', 'Asistencias', 'Usuarios únicos', 'Material']);
        
        (this.data.porServicio || []).forEach(s => {
            filas.push([s.area, s.capacitaciones, s.asistencias, s.usuariosUnicos, s.material]);
        });

        const csv = filas.map(f => f.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estadisticas_${this.filtros.anio}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.estadisticasManager = new EstadisticasManager();
});