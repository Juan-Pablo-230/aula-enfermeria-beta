// clases-publicas.js - Versión con datetime-local para fecha/hora de clase y cierre
console.log('📚 Módulo de Clases Públicas cargado (con datetime-local)');

class ClasesPublicasManager {
    constructor() {
        this.data = [];
        this.editandoId = null;
        this.areasDisponibles = [];
        this.init();
    }

    async init() {
        await this.cargarAreas();
        await this.cargarDatos();
        this.setupEventListeners();
    }

    async cargarAreas() {
        console.log('📥 Cargando áreas disponibles...');
        const areaSelect = document.getElementById('claseArea');
        const filtroArea = document.getElementById('filtroArea');
        
        if (!areaSelect && !filtroArea) return;
        
        const maxIntentos = 20;
        let intentos = 0;
        
        while ((!window.area || Object.keys(window.area).length === 0) && intentos < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, 100));
            intentos++;
        }
        
        if (window.area && typeof window.area === 'object') {
            const areas = new Set();
            
            for (const categoria in window.area) {
                if (Array.isArray(window.area[categoria])) {
                    window.area[categoria].forEach(areaName => {
                        if (areaName && typeof areaName === 'string') {
                            areas.add(areaName);
                        }
                    });
                }
            }
            
            this.areasDisponibles = Array.from(areas).sort();
            console.log('📋 Áreas encontradas:', this.areasDisponibles);
            
            if (areaSelect) {
                const currentValue = areaSelect.value;
                areaSelect.innerHTML = '<option value="todas">🌍 Todas las áreas</option>';
                
                this.areasDisponibles.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    areaSelect.appendChild(option);
                });
                
                if (currentValue && currentValue !== 'todas') {
                    const optionExists = Array.from(areaSelect.options).some(opt => opt.value === currentValue);
                    if (optionExists) areaSelect.value = currentValue;
                }
                
                console.log('✅ Selector de áreas poblado. Opciones:', Array.from(areaSelect.options).map(opt => ({ value: opt.value, text: opt.text })));
            }
            
            if (filtroArea) {
                filtroArea.innerHTML = '<option value="todas">🌍 Todas las áreas</option>';
                this.areasDisponibles.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    filtroArea.appendChild(option);
                });
            }
        } else {
            console.warn('⚠️ window.area no disponible');
            if (areaSelect) areaSelect.innerHTML = '<option value="todas">🌍 Todas las áreas</option>';
            if (filtroArea) filtroArea.innerHTML = '<option value="todas">🌍 Todas las áreas</option>';
        }
    }

    setupEventListeners() {
        document.getElementById('claseForm')?.addEventListener('submit', (e) => this.guardarClase(e));
        document.getElementById('limpiarFormBtn')?.addEventListener('click', () => this.cancelarEdicion());
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelarEdicion());
        document.getElementById('refrescarClasesBtn')?.addEventListener('click', () => this.cargarDatos());
        
        document.getElementById('buscarClase')?.addEventListener('input', (e) => {
            this.mostrarLista(e.target.value, 
                document.getElementById('filtroVisibilidad')?.value || 'todas',
                document.getElementById('filtroArea')?.value || 'todas');
        });
        
        document.getElementById('filtroVisibilidad')?.addEventListener('change', (e) => {
            this.mostrarLista(document.getElementById('buscarClase')?.value || '',
                e.target.value,
                document.getElementById('filtroArea')?.value || 'todas');
        });
        
        document.getElementById('filtroArea')?.addEventListener('change', (e) => {
            this.mostrarLista(document.getElementById('buscarClase')?.value || '',
                document.getElementById('filtroVisibilidad')?.value || 'todas',
                e.target.value);
        });
    }

    async cargarDatos() {
        try {
            const result = await authSystem.makeRequest('/clases-publicas', null, 'GET');
            this.data = result.data || [];
            console.log(`✅ ${this.data.length} clases públicas cargadas`);
            this.mostrarLista();
            this.actualizarEstadisticas();
        } catch (error) {
            console.error('❌ Error cargando clases públicas:', error);
            this.mostrarError();
        }
    }

    mostrarLista(filtroTexto = '', filtroVisibilidad = 'todas', filtroArea = 'todas') {
        const container = document.getElementById('clasesList');
        if (!container) return;

        let clasesFiltradas = this.data;
        
        if (filtroTexto) {
            const termino = filtroTexto.toLowerCase();
            clasesFiltradas = clasesFiltradas.filter(c => 
                c.nombre?.toLowerCase().includes(termino) ||
                c.descripcion?.toLowerCase().includes(termino) ||
                (c.instructores && c.instructores.some(i => i.toLowerCase().includes(termino)))
            );
        }
        
        if (filtroVisibilidad === 'publicadas') {
            clasesFiltradas = clasesFiltradas.filter(c => c.publicada === true);
        } else if (filtroVisibilidad === 'no-publicadas') {
            clasesFiltradas = clasesFiltradas.filter(c => c.publicada === false);
        }
        
        if (filtroArea && filtroArea !== 'todas') {
            console.log(`🔍 Filtrando por área: "${filtroArea}"`);
            clasesFiltradas = clasesFiltradas.filter(c => {
                if (!c.area || c.area === 'todas') return true;
                return c.area === filtroArea;
            });
        }

        if (clasesFiltradas.length === 0) {
            container.innerHTML = `<div class="empty-message">No hay clases públicas para mostrar</div>`;
            return;
        }

        clasesFiltradas.sort((a, b) => new Date(b.fechaClase) - new Date(a.fechaClase));

        container.innerHTML = clasesFiltradas.map(clase => {
            let fechaFormateada = 'N/A';
            if (clase.fechaClase) {
                const fecha = new Date(clase.fechaClase);
                fechaFormateada = fecha.toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            }
            
            let cierreFormateado = 'No definido';
            if (clase.fechaCierre) {
                const fechaCierre = new Date(clase.fechaCierre);
                cierreFormateado = fechaCierre.toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            }
            
            const estadoIcono = clase.publicada ? '✅' : '⏸️';
            const estadoTexto = clase.publicada ? 'Publicada' : 'No publicada';
            const estadoClass = clase.publicada ? 'publicada' : 'no-publicada';
            
            let areaInfo = '';
            if (!clase.area || clase.area === 'todas') {
                areaInfo = '<div class="clase-area">🌍 Área: Todas las áreas</div>';
            } else {
                areaInfo = `<div class="clase-area">👥 Área: ${this.escapeHtml(clase.area)}</div>`;
            }
            
            return `
                <div class="clase-card ${estadoClass}">
                    <div class="clase-header">
                        <span class="clase-titulo">${this.escapeHtml(clase.nombre)}</span>
                        <span class="clase-estado ${estadoClass}">${estadoIcono} ${estadoTexto}</span>
                    </div>
                    ${clase.descripcion ? `<p class="clase-descripcion">${this.escapeHtml(clase.descripcion)}</p>` : ''}
                    <div class="clase-detalles">
                        <span>📅 Clase: ${fechaFormateada}</span>
                        <span>🔒 Cierre: ${cierreFormateado}</span>
                        ${clase.instructores?.length ? `<span>👥 ${this.escapeHtml(clase.instructores.join(', '))}</span>` : ''}
                        ${clase.lugar ? `<span>📍 ${this.escapeHtml(clase.lugar)}</span>` : ''}
                    </div>
                    ${areaInfo}
                    <div class="clase-enlaces">
                        ${clase.enlaceFormulario ? `<a href="${clase.enlaceFormulario}" target="_blank" class="material-link">📝 Formulario</a>` : '<span class="sin-enlaces">Sin formulario asociado</span>'}
                    </div>
                    <div class="clase-acciones">
                        <button class="btn-small btn-edit" onclick="clasesPublicasManager.editarClase('${clase._id}')">✏️ Editar</button>
                        <button class="btn-small btn-danger" onclick="clasesPublicasManager.eliminarClase('${clase._id}')">🗑️ Eliminar</button>
                        ${clase.publicada ? 
                            `<button class="btn-small btn-warning" onclick="clasesPublicasManager.cambiarVisibilidad('${clase._id}', false)">⏸️ Ocultar</button>` :
                            `<button class="btn-small btn-success" onclick="clasesPublicasManager.cambiarVisibilidad('${clase._id}', true)">✅ Publicar</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    async guardarClase(event) {
        event.preventDefault();
        
        const areaSelect = document.getElementById('claseArea');
        let areaSeleccionada = 'todas';
        
        if (areaSelect) {
            areaSeleccionada = areaSelect.value;
        }
        
        const nombre = document.getElementById('claseNombre')?.value.trim();
        const fechaHoraClase = document.getElementById('claseFechaHora')?.value;
        const fechaCierre = document.getElementById('claseFechaCierre')?.value;
        const publicada = document.querySelector('input[name="visibilidad"]:checked')?.value === 'true';
        
        if (!nombre) {
            this.mostrarMensaje('❌ El nombre de la clase es obligatorio', 'error');
            return;
        }
        
        if (!fechaHoraClase) {
            this.mostrarMensaje('❌ La fecha y hora de la clase es obligatoria', 'error');
            return;
        }
        
        if (!fechaCierre) {
            this.mostrarMensaje('❌ La fecha y hora de cierre es obligatoria', 'error');
            return;
        }
        
        // Validar que fechaCierre sea posterior a fechaHoraClase
        const fechaClaseObj = new Date(fechaHoraClase);
        const fechaCierreObj = new Date(fechaCierre);
        if (fechaCierreObj <= fechaClaseObj) {
            this.mostrarMensaje('❌ La fecha de cierre debe ser posterior a la fecha/hora de la clase', 'error');
            return;
        }
        
        const instructores = document.getElementById('claseInstructores')?.value
            ? document.getElementById('claseInstructores').value.split(',').map(i => i.trim()).filter(i => i)
            : [];
        
        const claseData = {
            nombre: nombre,
            descripcion: document.getElementById('claseDescripcion')?.value || '',
            fechaClase: fechaHoraClase,
            fechaCierre: fechaCierre,
            instructores: instructores,
            lugar: document.getElementById('claseLugar')?.value || '',
            enlaceFormulario: document.getElementById('claseEnlaceFormulario')?.value || '',
            publicada: publicada,
            area: areaSeleccionada
        };
        
        console.log('📤 ENVIANDO AL SERVIDOR:', JSON.stringify(claseData, null, 2));
        
        try {
            let response;
            if (this.editandoId) {
                response = await authSystem.makeRequest(`/clases-publicas/${this.editandoId}`, claseData, 'PUT');
                this.mostrarMensaje('✅ Clase actualizada correctamente', 'success');
            } else {
                response = await authSystem.makeRequest('/clases-publicas', claseData);
                this.mostrarMensaje('✅ Clase creada correctamente', 'success');
            }
            
            console.log('✅ Respuesta del servidor:', response);
            
            this.cancelarEdicion();
            await this.cargarDatos();
        } catch (error) {
            console.error('❌ Error detallado:', error);
            this.mostrarMensaje('❌ Error: ' + error.message, 'error');
        }
    }

    editarClase(id) {
        const clase = this.data.find(c => c._id === id);
        if (!clase) return;

        this.editandoId = id;
        
        document.getElementById('claseNombre').value = clase.nombre || '';
        document.getElementById('claseDescripcion').value = clase.descripcion || '';
        
        // Cargar fecha y hora de la clase
        if (clase.fechaClase) {
            const fecha = new Date(clase.fechaClase);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            const hours = String(fecha.getHours()).padStart(2, '0');
            const minutes = String(fecha.getMinutes()).padStart(2, '0');
            document.getElementById('claseFechaHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        // Cargar fecha de cierre
        if (clase.fechaCierre) {
            const fechaCierre = new Date(clase.fechaCierre);
            const year = fechaCierre.getFullYear();
            const month = String(fechaCierre.getMonth() + 1).padStart(2, '0');
            const day = String(fechaCierre.getDate()).padStart(2, '0');
            const hours = String(fechaCierre.getHours()).padStart(2, '0');
            const minutes = String(fechaCierre.getMinutes()).padStart(2, '0');
            document.getElementById('claseFechaCierre').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            // Si no tiene fechaCierre, establecer un valor por defecto (1 hora después de la clase)
            if (clase.fechaClase) {
                const fechaClase = new Date(clase.fechaClase);
                const defaultCierre = new Date(fechaClase.getTime() + 60 * 60 * 1000);
                const year = defaultCierre.getFullYear();
                const month = String(defaultCierre.getMonth() + 1).padStart(2, '0');
                const day = String(defaultCierre.getDate()).padStart(2, '0');
                const hours = String(defaultCierre.getHours()).padStart(2, '0');
                const minutes = String(defaultCierre.getMinutes()).padStart(2, '0');
                document.getElementById('claseFechaCierre').value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }
        
        document.getElementById('claseInstructores').value = clase.instructores?.join(', ') || '';
        document.getElementById('claseLugar').value = clase.lugar || '';
        document.getElementById('claseEnlaceFormulario').value = clase.enlaceFormulario || '';
        
        const areaSelect = document.getElementById('claseArea');
        if (areaSelect) {
            const areaValue = clase.area || 'todas';
            
            let optionExists = false;
            for (let i = 0; i < areaSelect.options.length; i++) {
                if (areaSelect.options[i].value === areaValue) {
                    optionExists = true;
                    break;
                }
            }
            
            if (optionExists) {
                areaSelect.value = areaValue;
            } else {
                const newOption = document.createElement('option');
                newOption.value = areaValue;
                newOption.textContent = areaValue;
                areaSelect.appendChild(newOption);
                areaSelect.value = areaValue;
                console.log(`⚠️ Opción "${areaValue}" no existía, fue agregada`);
            }
            
            console.log(`✅ Área seleccionada: ${areaSelect.value}`);
        }
        
        const radioPublicada = document.querySelector('input[name="visibilidad"][value="true"]');
        const radioNoPublicada = document.querySelector('input[name="visibilidad"][value="false"]');
        if (clase.publicada) {
            radioPublicada.checked = true;
        } else {
            radioNoPublicada.checked = true;
        }
        
        document.getElementById('formTitle').innerHTML = '✏️ Editando: ' + clase.nombre;
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        document.getElementById('submitClaseBtn').textContent = '✏️ Actualizar Clase';
        
        document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
    }

    cancelarEdicion() {
        this.editandoId = null;
        this.limpiarFormulario();
        document.getElementById('formTitle').innerHTML = '➕ Agregar Nueva Clase Pública';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('submitClaseBtn').textContent = '💾 Guardar Clase';
    }

    limpiarFormulario() {
        document.getElementById('claseForm').reset();
        
        // Establecer fecha y hora de clase por defecto (ahora + 1 hora)
        const ahora = new Date();
        const defaultClase = new Date(ahora.getTime() + 60 * 60 * 1000);
        const yearClase = defaultClase.getFullYear();
        const monthClase = String(defaultClase.getMonth() + 1).padStart(2, '0');
        const dayClase = String(defaultClase.getDate()).padStart(2, '0');
        const hoursClase = String(defaultClase.getHours()).padStart(2, '0');
        const minutesClase = String(defaultClase.getMinutes()).padStart(2, '0');
        document.getElementById('claseFechaHora').value = `${yearClase}-${monthClase}-${dayClase}T${hoursClase}:${minutesClase}`;
        
        // Establecer fecha de cierre por defecto (2 horas después de la clase)
        const defaultCierre = new Date(defaultClase.getTime() + 60 * 60 * 1000);
        const yearCierre = defaultCierre.getFullYear();
        const monthCierre = String(defaultCierre.getMonth() + 1).padStart(2, '0');
        const dayCierre = String(defaultCierre.getDate()).padStart(2, '0');
        const hoursCierre = String(defaultCierre.getHours()).padStart(2, '0');
        const minutesCierre = String(defaultCierre.getMinutes()).padStart(2, '0');
        document.getElementById('claseFechaCierre').value = `${yearCierre}-${monthCierre}-${dayCierre}T${hoursCierre}:${minutesCierre}`;
        
        const areaSelect = document.getElementById('claseArea');
        if (areaSelect) areaSelect.value = 'todas';
        
        document.querySelector('input[name="visibilidad"][value="false"]').checked = true;
        this.ocultarMensaje();
    }

    async eliminarClase(id) {
        if (!confirm('¿Está seguro de eliminar esta clase?')) return;
        try {
            await authSystem.makeRequest(`/clases-publicas/${id}`, null, 'DELETE');
            this.mostrarMensaje('✅ Clase eliminada correctamente', 'success');
            await this.cargarDatos();
        } catch (error) {
            this.mostrarMensaje('❌ Error al eliminar: ' + error.message, 'error');
        }
    }

    async cambiarVisibilidad(id, publicada) {
        try {
            await authSystem.makeRequest(`/clases-publicas/${id}/visibilidad`, { publicada }, 'PUT');
            this.mostrarMensaje(`✅ Clase ${publicada ? 'publicada' : 'ocultada'} correctamente`, 'success');
            await this.cargarDatos();
        } catch (error) {
            this.mostrarMensaje('❌ Error al cambiar visibilidad: ' + error.message, 'error');
        }
    }

    actualizarEstadisticas() {
        const total = this.data.length;
        const publicadas = this.data.filter(c => c.publicada === true).length;
        const noPublicadas = this.data.filter(c => c.publicada === false).length;
        const conFormulario = this.data.filter(c => c.enlaceFormulario).length;

        document.getElementById('totalClases').textContent = total;
        document.getElementById('clasesPublicadas').textContent = publicadas;
        document.getElementById('clasesNoPublicadas').textContent = noPublicadas;
        document.getElementById('clasesConFormulario').textContent = conFormulario;
    }

    mostrarMensaje(texto, tipo) {
        const msg = document.getElementById('formMessage');
        msg.textContent = texto;
        msg.className = `message ${tipo}`;
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }

    ocultarMensaje() {
        document.getElementById('formMessage').style.display = 'none';
    }

    mostrarError() {
        const container = document.getElementById('clasesList');
        if (container) {
            container.innerHTML = `<div class="error-message">⚠️ Error al cargar las clases públicas</div>`;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.clasesPublicasManager = new ClasesPublicasManager();
});