// inscripciones.js - Versión con hora 24h
console.log('📋 Módulo de Inscripciones cargado');

class InscripcionesManager {
    constructor() {
        this.data = [];
        this.filtroClase = 'todas';
        this.filtroPeriodo = 'todo';
        this.init();
    }

    async init() {
        await this.cargarDatos();
        this.setupEventListeners();
    }

    async cargarDatos() {
        try {
            const result = await authSystem.makeRequest('/inscripciones', null, 'GET');
            this.data = result.data || [];
            console.log(`✅ ${this.data.length} inscripciones cargadas`);
            this.actualizarUI();
        } catch (error) {
            console.error('❌ Error cargando inscripciones:', error);
            this.mostrarError();
        }
    }

    filtrarDatos() {
        let datos = [...this.data];

        if (this.filtroClase !== 'todas') {
            datos = datos.filter(d => d.clase === this.filtroClase);
        }

        const ahora = new Date();
        if (this.filtroPeriodo === 'hoy') {
            const hoy = ahora.toDateString();
            datos = datos.filter(d => {
                if (!d.fecha) return false;
                return new Date(d.fecha).toDateString() === hoy;
            });
        } else if (this.filtroPeriodo === 'semana') {
            const semanaAtras = new Date(ahora.setDate(ahora.getDate() - 7));
            datos = datos.filter(d => {
                if (!d.fecha) return false;
                return new Date(d.fecha) >= semanaAtras;
            });
        } else if (this.filtroPeriodo === 'mes') {
            const mesAtras = new Date(ahora.setMonth(ahora.getMonth() - 1));
            datos = datos.filter(d => {
                if (!d.fecha) return false;
                return new Date(d.fecha) >= mesAtras;
            });
        }

        return datos;
    }

    actualizarUI() {
        this.actualizarFiltros();
        this.mostrarTabla();
        this.actualizarEstadisticas();
    }

    actualizarFiltros() {
        const selectClase = document.getElementById('filtroClase');
        if (!selectClase) return;

        const clases = [...new Set(this.data.map(d => d.clase).filter(Boolean))];
        
        selectClase.innerHTML = '<option value="todas">Todas las clases</option>';
        clases.sort().forEach(clase => {
            const option = document.createElement('option');
            option.value = clase;
            option.textContent = clase;
            if (clase === this.filtroClase) option.selected = true;
            selectClase.appendChild(option);
        });
    }

    mostrarTabla() {
        const tbody = document.getElementById('inscripcionesBody');
        if (!tbody) return;

        const datosFiltrados = this.filtrarDatos();

        if (datosFiltrados.length === 0) {
            tbody.innerHTML = `
                 <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        No hay inscripciones para mostrar
                     </td>
                 </tr>
            `;
            return;
        }

        tbody.innerHTML = datosFiltrados.map((insc, index) => {
            // Formatear fecha en 24h
            let fechaFormateada = 'N/A';
            if (insc.fecha) {
                const fecha = new Date(insc.fecha);
                fechaFormateada = fecha.toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${insc.usuario?.apellidoNombre || 'N/A'}</td>
                    <td>${insc.usuario?.legajo || 'N/A'}</td>
                    <td>${insc.clase || 'N/A'}</td>
                    <td>${insc.turno || 'N/A'}</td>
                    <td><a href="mailto:${insc.usuario?.email || ''}" class="email-link">${insc.usuario?.email || 'N/A'}</a></td>
                    <td>${fechaFormateada}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('contadorResultados').textContent = 
            `${datosFiltrados.length} inscripciones mostradas`;
    }

    actualizarEstadisticas() {
        const total = this.data.length;
        const hoy = this.data.filter(d => {
            if (!d.fecha) return false;
            return new Date(d.fecha).toDateString() === new Date().toDateString();
        }).length;
        
        const semana = this.data.filter(d => {
            if (!d.fecha) return false;
            const semanaAtras = new Date();
            semanaAtras.setDate(semanaAtras.getDate() - 7);
            return new Date(d.fecha) >= semanaAtras;
        }).length;

        document.getElementById('totalInscripciones').textContent = total;
        document.getElementById('inscripcionesHoy').textContent = hoy;
        document.getElementById('inscripcionesSemana').textContent = semana;
    }

    mostrarError() {
        const tbody = document.getElementById('inscripcionesBody');
        if (tbody) {
            tbody.innerHTML = `
                 <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #ff6b6b;">
                        ⚠️ Error al cargar las inscripciones
                     </td>
                 </tr>
            `;
        }
    }

    exportarCSV() {
        const datosFiltrados = this.filtrarDatos();
        
        if (datosFiltrados.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = ['Apellido y Nombre', 'Legajo', 'Clase', 'Turno', 'Email', 'Fecha'];
        const csv = [
            headers.join(','),
            ...datosFiltrados.map(insc => {
                let fechaFormateada = '';
                if (insc.fecha) {
                    const fecha = new Date(insc.fecha);
                    fechaFormateada = fecha.toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
                
                return [
                    `"${insc.usuario?.apellidoNombre || ''}"`,
                    `"${insc.usuario?.legajo || ''}"`,
                    `"${insc.clase || ''}"`,
                    `"${insc.turno || ''}"`,
                    `"${insc.usuario?.email || ''}"`,
                    `"${fechaFormateada}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inscripciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    }

    setupEventListeners() {
        document.getElementById('filtroClase')?.addEventListener('change', (e) => {
            this.filtroClase = e.target.value;
            this.mostrarTabla();
        });

        document.getElementById('filtroPeriodo')?.addEventListener('change', (e) => {
            this.filtroPeriodo = e.target.value;
            this.mostrarTabla();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportarCSV();
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.cargarDatos();
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.inscripcionesManager = new InscripcionesManager();
});