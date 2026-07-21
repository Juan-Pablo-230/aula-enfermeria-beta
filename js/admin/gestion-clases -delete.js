// gestion-clases.js - Versión con área de trabajo y logs
console.log('🎯 Módulo de Gestión de Clases cargado (con área)');

class GestionClasesManager {
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
                document.getElementById('filtroEstado')?.value || 'todos',
                document.getElementById('filtroArea')?.value || 'todas');
        });
        
        document.getElementById('filtroEstado')?.addEventListener('change', (e) => {
            this.mostrarLista(document.getElementById('buscarClase')?.value || '',
                e.target.value,
                document.getElementById('filtroArea')?.value || 'todas');
        });
        
        document.getElementById('filtroArea')?.addEventListener('change', (e) => {
            this.mostrarLista(document.getElementById('buscarClase')?.value || '',
                document.getElementById('filtroEstado')?.value || 'todos',
                e.target.value);
        });
    }

    async cargarDatos() {
        try {
            const result = await authSystem.makeRequest('/clases-historicas', null, 'GET');
            this.data = result.data || [];
            console.log(`✅ ${this.data.length} clases cargadas`);
            this.mostrarLista();
            this.actualizarEstadisticas();
        } catch (error) {
            console.error('❌ Error cargando clases:', error);
            this.mostrarError();
        }
    }

    mostrarLista(filtroTexto = '', filtroEstado = 'todos', filtroArea = 'todas') {
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
        
        if (filtroEstado === 'publicadas') {
            clasesFiltradas = clasesFiltradas.filter(c => c.estado === 'publicada');
        } else if (filtroEstado === 'activas') {
            clasesFiltradas = clasesFiltradas.filter(c => c.estado === 'activa');
        } else if (filtroEstado === 'canceladas') {
            clasesFiltradas = clasesFiltradas.filter(c => c.estado === 'cancelada');
        }
        
        if (filtroArea && filtroArea !== 'todas') {
            console.log(`🔍 Filtrando por área: "${filtroArea}"`);
            clasesFiltradas = clasesFiltradas.filter(c => {
                if (!c.area || c.area === 'todas') return true;
                return c.area === filtroArea;
            });
        }

        if (clasesFiltradas.length === 0) {
            container.innerHTML = `<div class="empty-message">No hay clases para mostrar</div>`;
            return;
        }

        clasesFiltradas.sort((a, b) => new Date(b.fechaClase) - new Date(a.fechaClase));

        container.innerHTML = clasesFiltradas.map(clase => {
            const estado = clase.estado || (clase.activa ? 'activa' : 'inactiva');
            const tieneYoutube = clase.enlaces?.youtube ? true : false;
            const tienePowerpoint = clase.enlaces?.powerpoint ? true : false;
            
            let fechaFormateada = 'N/A';
            if (clase.fechaClase) {
                const fecha = new Date(clase.fechaClase);
                fechaFormateada = fecha.toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            }
            
            let estadoIcono = '', estadoTexto = '', estadoClass = '';
            if (estado === 'publicada') {
                estadoIcono = '📢'; estadoTexto = 'Publicada'; estadoClass = 'publicada';
            } else if (estado === 'activa') {
                estadoIcono = '✅'; estadoTexto = 'Activa'; estadoClass = 'activa';
            } else if (estado === 'cancelada') {
                estadoIcono = '❌'; estadoTexto = 'Cancelada'; estadoClass = 'cancelada';
            } else {
                estadoIcono = clase.activa ? '✅' : '❌';
                estadoTexto = clase.activa ? 'Activa' : 'Inactiva';
                estadoClass = clase.activa ? 'activa' : 'inactiva';
            }
            
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
                        <span>📅 ${fechaFormateada}</span>
                        ${clase.instructores?.length ? `<span>👥 ${this.escapeHtml(clase.instructores.join(', '))}</span>` : ''}
                    </div>
                    ${areaInfo}
                    <div class="clase-enlaces">
                        ${tieneYoutube ? `<a href="${clase.enlaces.youtube}" target="_blank" class="material-link youtube">▶️ YouTube</a>` : ''}
                        ${tienePowerpoint ? `<a href="${clase.enlaces.powerpoint}" target="_blank" class="material-link powerpoint">📊 Presentación</a>` : ''}
                        ${!tieneYoutube && !tienePowerpoint ? '<span class="sin-enlaces">Sin material disponible</span>' : ''}
                    </div>
                    ${clase.tags?.length ? `<div class="clase-tags">${clase.tags.map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                    <div class="clase-acciones">
                        <button class="btn-small btn-edit" onclick="gestionClasesManager.editarClase('${clase._id}')">✏️ Editar</button>
                        <button class="btn-small btn-danger" onclick="gestionClasesManager.eliminarClase('${clase._id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async guardarClase(event) {
        event.preventDefault();
        
        // ========== DIAGNÓSTICO ==========
        console.log('🔍 ========== DIAGNÓSTICO DE ÁREA (Gestión de Clases) ==========');
        
        const areaSelect = document.getElementById('claseArea');
        let areaSeleccionada = 'todas';
        
        if (areaSelect) {
            console.log('📌 Select de área encontrado');
            console.log('📌 Valor ACTUAL del select:', areaSelect.value);
            console.log('📌 Todas las opciones:');
            Array.from(areaSelect.options).forEach(opt => {
                console.log(`   - value: "${opt.value}", text: "${opt.text}"`);
            });
            areaSeleccionada = areaSelect.value;
        } else {
            console.error('❌ Select de área NO ENCONTRADO!');
        }
        
        console.log('📌 Área seleccionada para guardar:', areaSeleccionada);
        // ========== FIN DIAGNÓSTICO ==========
        
        const nombre = document.getElementById('claseNombre')?.value.trim();
        const fecha = document.getElementById('claseFecha')?.value;
        const youtube = document.getElementById('claseYoutube')?.value.trim();
        const powerpoint = document.getElementById('clasePowerpoint')?.value.trim();
        
        if (!nombre) {
            this.mostrarMensaje('❌ El nombre de la clase es obligatorio', 'error');
            return;
        }
        
        if (!fecha) {
            this.mostrarMensaje('❌ La fecha de la clase es obligatoria', 'error');
            return;
        }
        
        const hora = document.getElementById('claseHora')?.value || '10:00';
        const fechaCompleta = `${fecha}T${hora}:00`;
        
        const instructores = document.getElementById('claseInstructores')?.value
            ? document.getElementById('claseInstructores').value.split(',').map(i => i.trim()).filter(i => i)
            : [];
        
        const tags = document.getElementById('claseTags')?.value
            ? document.getElementById('claseTags').value.split(',').map(t => t.trim()).filter(t => t)
            : [];
        
        const estadoRadio = document.querySelector('input[name="claseEstado"]:checked');
        const estado = estadoRadio ? estadoRadio.value : 'publicada';
        
        const claseData = {
            nombre: nombre,
            descripcion: document.getElementById('claseDescripcion')?.value || '',
            fechaClase: fechaCompleta,
            enlaces: {
                youtube: youtube || '',
                powerpoint: powerpoint || ''
            },
            estado: estado,
            instructores: instructores,
            tags: tags,
            area: areaSeleccionada
        };
        
        console.log('📤 ENVIANDO AL SERVIDOR:', JSON.stringify(claseData, null, 2));
        
        try {
            let response;
            if (this.editandoId) {
                response = await authSystem.makeRequest(`/clases-historicas/${this.editandoId}`, claseData, 'PUT');
                this.mostrarMensaje('✅ Clase actualizada correctamente', 'success');
            } else {
                response = await authSystem.makeRequest('/clases-historicas', claseData);
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
        
        if (clase.fechaClase) {
            const fecha = new Date(clase.fechaClase);
            document.getElementById('claseFecha').value = fecha.toISOString().split('T')[0];
            document.getElementById('claseHora').value = fecha.toTimeString().slice(0, 5);
        }
        
        document.getElementById('claseYoutube').value = clase.enlaces?.youtube || '';
        document.getElementById('clasePowerpoint').value = clase.enlaces?.powerpoint || '';
        document.getElementById('claseInstructores').value = clase.instructores?.join(', ') || '';
        document.getElementById('claseTags').value = clase.tags?.join(', ') || '';
        
        const areaSelect = document.getElementById('claseArea');
        if (areaSelect) {
            const areaValue = clase.area || 'todas';
            console.log(`📌 Cargando área: "${areaValue}" para la clase: ${clase.nombre}`);
            
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
        
        document.querySelectorAll('input[name="claseEstado"]').forEach(radio => radio.checked = false);
        
        let estadoValor = clase.estado || (clase.activa ? 'activa' : 'inactiva');
        const radioToCheck = document.querySelector(`input[name="claseEstado"][value="${estadoValor}"]`);
        if (radioToCheck) {
            radioToCheck.checked = true;
        } else {
            const radioPublicada = document.querySelector('input[name="claseEstado"][value="publicada"]');
            if (radioPublicada) radioPublicada.checked = true;
        }
        
        document.getElementById('formTitle').innerHTML = '✏️ Editando: ' + clase.nombre;
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        document.getElementById('submitClaseBtn').textContent = '✏️ Actualizar Clase';
        
        document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
    }

    cancelarEdicion() {
        this.editandoId = null;
        this.limpiarFormulario();
        document.getElementById('formTitle').innerHTML = '➕ Agregar Nueva Clase';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('submitClaseBtn').textContent = '💾 Guardar Clase';
    }

    limpiarFormulario() {
        document.getElementById('claseForm').reset();
        document.getElementById('claseHora').value = '10:00';
        
        const areaSelect = document.getElementById('claseArea');
        if (areaSelect) areaSelect.value = 'todas';
        
        const radioPublicada = document.querySelector('input[name="claseEstado"][value="publicada"]');
        if (radioPublicada) radioPublicada.checked = true;
        
        document.querySelectorAll('input[name="claseEstado"]').forEach(radio => {
            if (radio.value !== 'publicada') radio.checked = false;
        });
        
        this.ocultarMensaje();
    }

    async eliminarClase(id) {
        if (!confirm('¿Está seguro de eliminar esta clase?')) return;
        try {
            await authSystem.makeRequest(`/clases-historicas/${id}`, null, 'DELETE');
            this.mostrarMensaje('✅ Clase eliminada correctamente', 'success');
            await this.cargarDatos();
        } catch (error) {
            this.mostrarMensaje('❌ Error al eliminar: ' + error.message, 'error');
        }
    }

    actualizarEstadisticas() {
        const total = this.data.length;
        const publicadas = this.data.filter(c => c.estado === 'publicada').length;
        const activas = this.data.filter(c => c.estado === 'activa').length;
        const canceladas = this.data.filter(c => c.estado === 'cancelada').length;

        document.getElementById('totalClases').textContent = total;
        document.getElementById('clasesPublicadas').textContent = publicadas;
        document.getElementById('clasesActivas').textContent = activas;
        document.getElementById('clasesCanceladas').textContent = canceladas;
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
            container.innerHTML = `<div class="error-message">⚠️ Error al cargar las clases</div>`;
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
    window.gestionClasesManager = new GestionClasesManager();
});