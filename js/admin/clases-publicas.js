// clases-publicas.js - Versión con redirección automática por modalidad
console.log('📚 Módulo de Clases Públicas cargado (con redirección automática)');

class ClasesPublicasManager {
    constructor() {
        this.data = [];
        this.editandoId = null;
        this.areasDisponibles = [];
        this.claseMaterialId = null;
        this.init();
    }

    async init() {
        await this.cargarAreas();
        await this.cargarDatos();
        this.setupEventListeners();
        this.setupModalidadListeners();
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
                        if (areaName && typeof areaName === 'string') areas.add(areaName);
                    });
                }
            }
            
            this.areasDisponibles = Array.from(areas).sort();
            
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

    // ============================================
    // LÓGICA DE MODALIDAD
    // ============================================

    setupModalidadListeners() {
        const modalidadSelect = document.getElementById('claseModalidad');
        const plataformaSelect = document.getElementById('clasePlataforma');
        const enlaceVirtualInput = document.getElementById('claseEnlaceVirtual');

        modalidadSelect?.addEventListener('change', () => this.actualizarCamposModalidad());
        plataformaSelect?.addEventListener('change', () => this.actualizarCamposPlataforma());
        enlaceVirtualInput?.addEventListener('input', () => this.actualizarInfoRedireccion());
    }

    actualizarCamposModalidad() {
        const modalidad = document.getElementById('claseModalidad')?.value || '';
        
        const campoUbicacion = document.getElementById('campoUbicacion');
        const campoPlataforma = document.getElementById('campoPlataforma');
        const campoEnlaceVirtual = document.getElementById('campoEnlaceVirtual');
        const campoEnlaceYouTube = document.getElementById('campoEnlaceYouTube');
        const infoRedireccion = document.getElementById('infoRedireccion');

        // Reset
        if (campoUbicacion) campoUbicacion.style.display = 'none';
        if (campoPlataforma) campoPlataforma.style.display = 'none';
        if (campoEnlaceVirtual) campoEnlaceVirtual.style.display = 'none';
        if (campoEnlaceYouTube) campoEnlaceYouTube.style.display = 'none';
        if (infoRedireccion) infoRedireccion.style.display = 'none';

        const ubicacionInput = document.getElementById('claseUbicacion');
        const plataformaSelect = document.getElementById('clasePlataforma');
        const enlaceVirtualInput = document.getElementById('claseEnlaceVirtual');
        const enlaceYouTubeInput = document.getElementById('claseEnlaceYouTube');

        if (ubicacionInput) ubicacionInput.required = false;
        if (plataformaSelect) plataformaSelect.required = false;
        if (enlaceVirtualInput) enlaceVirtualInput.required = false;
        if (enlaceYouTubeInput) enlaceYouTubeInput.required = false;

        if (modalidad === 'Presencial') {
            if (campoUbicacion) campoUbicacion.style.display = 'block';
            if (ubicacionInput) ubicacionInput.required = true;
            if (infoRedireccion) infoRedireccion.style.display = 'block';
            this.actualizarInfoRedireccion();
        } else if (modalidad === 'Virtual') {
            if (campoPlataforma) campoPlataforma.style.display = 'block';
            if (plataformaSelect) plataformaSelect.required = true;
            if (infoRedireccion) infoRedireccion.style.display = 'block';
            this.actualizarCamposPlataforma();
        } else if (modalidad === 'Híbrido') {
            if (campoUbicacion) campoUbicacion.style.display = 'block';
            if (campoPlataforma) campoPlataforma.style.display = 'block';
            if (ubicacionInput) ubicacionInput.required = true;
            if (plataformaSelect) plataformaSelect.required = true;
            if (infoRedireccion) infoRedireccion.style.display = 'block';
            this.actualizarCamposPlataforma();
        }
    }

    actualizarCamposPlataforma() {
        const modalidad = document.getElementById('claseModalidad')?.value || '';
        const plataforma = document.getElementById('clasePlataforma')?.value || '';
        
        const campoEnlaceVirtual = document.getElementById('campoEnlaceVirtual');
        const campoEnlaceYouTube = document.getElementById('campoEnlaceYouTube');
        const enlaceVirtualInput = document.getElementById('claseEnlaceVirtual');
        const enlaceYouTubeInput = document.getElementById('claseEnlaceYouTube');

        if (modalidad !== 'Virtual' && modalidad !== 'Híbrido') return;

        if (campoEnlaceVirtual) campoEnlaceVirtual.style.display = 'none';
        if (campoEnlaceYouTube) campoEnlaceYouTube.style.display = 'none';
        if (enlaceVirtualInput) enlaceVirtualInput.required = false;
        if (enlaceYouTubeInput) enlaceYouTubeInput.required = false;

        if (plataforma === 'Reunión virtual') {
            if (campoEnlaceVirtual) campoEnlaceVirtual.style.display = 'block';
            if (enlaceVirtualInput) enlaceVirtualInput.required = true;
        } else if (plataforma === 'YouTube') {
            if (campoEnlaceYouTube) campoEnlaceYouTube.style.display = 'block';
            if (enlaceYouTubeInput) enlaceYouTubeInput.required = true;
        }

        this.actualizarInfoRedireccion();
    }

    // ============================================
    // INFO DE REDIRECCIÓN (TEXTO INFORMATIVO)
    // ============================================

    actualizarInfoRedireccion() {
        const modalidad = document.getElementById('claseModalidad')?.value || '';
        const plataforma = document.getElementById('clasePlataforma')?.value || '';
        const enlaceVirtual = document.getElementById('claseEnlaceVirtual')?.value.trim() || '';
        const infoTexto = document.getElementById('infoRedireccionTexto');

        if (!infoTexto) return;

        let mensaje = '';

        if (modalidad === 'Presencial') {
            mensaje = '🏛️ <strong>Redirige a:</strong> <code>/asistenciapres.html</code><br><small>El usuario completa la asistencia presencial automáticamente</small>';
        } else if (modalidad === 'Virtual') {
            if (plataforma === 'Reunión virtual') {
                if (enlaceVirtual) {
                    mensaje = `🎥 <strong>Redirige a:</strong> <code>${this.escapeHtml(enlaceVirtual)}</code><br><small>El usuario se une directamente a la reunión</small>`;
                } else {
                    mensaje = '🎥 <strong>Redirige a:</strong> <em>el enlace de la reunión</em> (complete el enlace arriba)';
                }
            } else if (plataforma === 'YouTube') {
                mensaje = '📺 <strong>Redirige a:</strong> <code>/clasesYT.html</code><br><small>El usuario ve la clase en vivo en YouTube</small>';
            } else {
                mensaje = '💻 Seleccione una plataforma para ver el destino';
            }
        } else if (modalidad === 'Híbrido') {
            mensaje = '🔄 <strong>Redirige a:</strong> <code>/asistenciapres.html</code><br><small>Asistencia presencial + opción virtual disponible</small>';
            if (plataforma === 'Reunión virtual' && enlaceVirtual) {
                mensaje += `<br>🎥 <strong>Reunión:</strong> <code>${this.escapeHtml(enlaceVirtual)}</code>`;
            } else if (plataforma === 'YouTube') {
                mensaje += `<br>📺 <strong>Video:</strong> <code>/clasesYT.html</code>`;
            }
        } else {
            mensaje = 'Seleccione una modalidad para ver el destino';
        }

        infoTexto.innerHTML = mensaje;
    }

    // ============================================
    // EXTRAER ID DE YOUTUBE
    // ============================================

    extraerYouTubeId(url) {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
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

    validarDuplicados(nombre, enlaceFormulario, idExcluir = null) {
        const nombreDuplicado = this.data.some(c => 
            c.nombre.toLowerCase() === nombre.toLowerCase() && 
            c._id !== idExcluir
        );

        if (nombreDuplicado) {
            return { 
                valido: false, 
                mensaje: `❌ Ya existe una clase con el nombre "${nombre}". Por favor, use otro nombre.` 
            };
        }

        return { valido: true, mensaje: '' };
    }

    // ============================================
    // GUARDAR CLASE (CON REDIRECCIÓN AUTOMÁTICA)
    // ============================================

    async guardarClase(event) {
        event.preventDefault();
        
        const areaSelect = document.getElementById('claseArea');
        let areaSeleccionada = areaSelect ? areaSelect.value : 'todas';
        
        const nombre = document.getElementById('claseNombre')?.value.trim();
        const fechaHoraClase = document.getElementById('claseFechaHora')?.value;
        const fechaCierre = document.getElementById('claseFechaCierre')?.value;
        const publicada = document.querySelector('input[name="visibilidad"]:checked')?.value === 'true';
        const modalidad = document.getElementById('claseModalidad')?.value || '';
        
        // Validaciones básicas
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
        if (!modalidad) {
            this.mostrarMensaje('❌ Debe seleccionar una modalidad', 'error');
            return;
        }
        
        // Validar fechas
        const fechaClaseObj = new Date(fechaHoraClase);
        const fechaCierreObj = new Date(fechaCierre);
        if (fechaCierreObj <= fechaClaseObj) {
            this.mostrarMensaje('❌ La fecha de cierre debe ser posterior a la fecha/hora de la clase', 'error');
            return;
        }
        
        // Validación de duplicados
        const validacion = this.validarDuplicados(nombre, null, this.editandoId);
        if (!validacion.valido) {
            this.mostrarMensaje(validacion.mensaje, 'error');
            return;
        }

        // ===== RECOLECTAR CAMPOS SEGÚN MODALIDAD =====
        let ubicacion = '';
        let plataforma = '';
        let enlaceVirtual = '';
        let enlaceYouTube = '';
        let youtubeVideoId = '';
        let enlaceFormulario = ''; // ← SE GENERA AUTOMÁTICAMENTE

        if (modalidad === 'Presencial' || modalidad === 'Híbrido') {
            ubicacion = document.getElementById('claseUbicacion')?.value.trim() || '';
            if (!ubicacion) {
                this.mostrarMensaje('❌ La ubicación es obligatoria para modalidad Presencial/Híbrido', 'error');
                return;
            }
            // ✅ Presencial siempre redirige a asistenciapres.html
            enlaceFormulario = '/asistenciapres.html';
        }

        if (modalidad === 'Virtual' || modalidad === 'Híbrido') {
            plataforma = document.getElementById('clasePlataforma')?.value || '';
            if (!plataforma) {
                this.mostrarMensaje('❌ La plataforma es obligatoria para modalidad Virtual/Híbrido', 'error');
                return;
            }

            if (plataforma === 'Reunión virtual') {
                enlaceVirtual = document.getElementById('claseEnlaceVirtual')?.value.trim() || '';
                if (!enlaceVirtual) {
                    this.mostrarMensaje('❌ El enlace de la reunión es obligatorio', 'error');
                    return;
                }
                // ✅ Virtual + Reunión virtual: redirige al enlace de la reunión
                if (modalidad === 'Virtual') {
                    enlaceFormulario = enlaceVirtual;
                }
            } else if (plataforma === 'YouTube') {
                enlaceYouTube = document.getElementById('claseEnlaceYouTube')?.value.trim() || '';
                if (!enlaceYouTube) {
                    this.mostrarMensaje('❌ La URL de YouTube es obligatoria', 'error');
                    return;
                }
                youtubeVideoId = this.extraerYouTubeId(enlaceYouTube);
                if (!youtubeVideoId) {
                    this.mostrarMensaje('❌ No se pudo extraer el ID del video de YouTube. Verifique la URL.', 'error');
                    return;
                }
                // ✅ Virtual + YouTube: redirige a clasesYT.html
                if (modalidad === 'Virtual') {
                    enlaceFormulario = '/clasesYT.html';
                }
                console.log('🎬 YouTube ID extraído:', youtubeVideoId);
            }
        }
        
        // Procesar instructores
        const instructores = document.getElementById('claseInstructores')?.value
            ? document.getElementById('claseInstructores').value.split(',').map(i => i.trim()).filter(i => i)
            : [];
        
        // Preparar datos
        const claseData = {
            nombre: nombre,
            descripcion: document.getElementById('claseDescripcion')?.value || '',
            fechaClase: fechaHoraClase,
            fechaCierre: fechaCierre,
            instructores: instructores,
            enlaceFormulario: enlaceFormulario, // ← Autogenerado
            publicada: publicada,
            area: areaSeleccionada,
            modalidad: modalidad,
            ubicacion: ubicacion,
            plataforma: plataforma,
            enlaceVirtual: enlaceVirtual,
            enlaceYouTube: enlaceYouTube,
            youtubeVideoId: youtubeVideoId,
            auditorio: document.getElementById('claseAuditorio')?.checked || false,
            cafeteria: document.getElementById('claseCafeteria')?.checked || false,
            material: document.getElementById('claseMaterial')?.checked || false
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
            
            // Si es YouTube, guardar videoId en localStorage para clasesYT.js
            if (youtubeVideoId) {
                try {
                    localStorage.setItem('claseYT_videoId', youtubeVideoId);
                    localStorage.setItem('claseYT_nombre', nombre);
                    console.log('💾 videoId guardado en localStorage:', youtubeVideoId);
                } catch (e) {
                    console.warn('⚠️ No se pudo guardar en localStorage:', e);
                }
            }
            
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
            const pad = (n) => String(n).padStart(2, '0');
            document.getElementById('claseFechaHora').value = 
                `${fecha.getFullYear()}-${pad(fecha.getMonth()+1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
        }
        
        if (clase.fechaCierre) {
            const fechaCierre = new Date(clase.fechaCierre);
            const pad = (n) => String(n).padStart(2, '0');
            document.getElementById('claseFechaCierre').value = 
                `${fechaCierre.getFullYear()}-${pad(fechaCierre.getMonth()+1)}-${pad(fechaCierre.getDate())}T${pad(fechaCierre.getHours())}:${pad(fechaCierre.getMinutes())}`;
        }
        
        document.getElementById('claseInstructores').value = clase.instructores?.join(', ') || '';
        
        // Modalidad
        const modalidadSelect = document.getElementById('claseModalidad');
        if (modalidadSelect) {
            modalidadSelect.value = clase.modalidad || '';
            this.actualizarCamposModalidad();
        }

        // Ubicación
        const ubicacionInput = document.getElementById('claseUbicacion');
        if (ubicacionInput) ubicacionInput.value = clase.ubicacion || '';

        // Plataforma
        const plataformaSelect = document.getElementById('clasePlataforma');
        if (plataformaSelect) {
            plataformaSelect.value = clase.plataforma || '';
            this.actualizarCamposPlataforma();
        }

        // Enlace virtual
        const enlaceVirtualInput = document.getElementById('claseEnlaceVirtual');
        if (enlaceVirtualInput) enlaceVirtualInput.value = clase.enlaceVirtual || '';

        // Enlace YouTube
        const enlaceYouTubeInput = document.getElementById('claseEnlaceYouTube');
        if (enlaceYouTubeInput) enlaceYouTubeInput.value = clase.enlaceYouTube || '';

        // Área
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
            }
        }
        
        // Controles internos
        document.getElementById('claseAuditorio').checked = clase.auditorio === true;
        document.getElementById('claseCafeteria').checked = clase.cafeteria === true;
        document.getElementById('claseMaterial').checked = clase.material === true;
        
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
        
        const ahora = new Date();
        const defaultClase = new Date(ahora.getTime() + 60 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        
        document.getElementById('claseFechaHora').value = fmt(defaultClase);
        document.getElementById('claseFechaCierre').value = fmt(new Date(defaultClase.getTime() + 60 * 60 * 1000));
        
        const areaSelect = document.getElementById('claseArea');
        if (areaSelect) areaSelect.value = 'todas';
        
        const modalidadSelect = document.getElementById('claseModalidad');
        if (modalidadSelect) modalidadSelect.value = '';
        this.actualizarCamposModalidad();

        const ubicacionInput = document.getElementById('claseUbicacion');
        if (ubicacionInput) ubicacionInput.value = '';
        const plataformaSelect = document.getElementById('clasePlataforma');
        if (plataformaSelect) plataformaSelect.value = '';
        const enlaceVirtualInput = document.getElementById('claseEnlaceVirtual');
        if (enlaceVirtualInput) enlaceVirtualInput.value = '';
        const enlaceYouTubeInput = document.getElementById('claseEnlaceYouTube');
        if (enlaceYouTubeInput) enlaceYouTubeInput.value = '';
        
        document.getElementById('claseAuditorio').checked = false;
        document.getElementById('claseCafeteria').checked = false;
        document.getElementById('claseMaterial').checked = false;
        
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
        document.getElementById('totalClases').textContent = this.data.length;
        document.getElementById('clasesPublicadas').textContent = this.data.filter(c => c.publicada === true).length;
        document.getElementById('clasesNoPublicadas').textContent = this.data.filter(c => c.publicada === false).length;
        document.getElementById('clasesConFormulario').textContent = this.data.filter(c => c.enlaceFormulario).length;
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

    // ============================================
    // MOSTRAR LISTA
    // ============================================

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
                fechaFormateada = new Date(clase.fechaClase).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            }
            
            let cierreFormateado = 'No definido';
            if (clase.fechaCierre) {
                cierreFormateado = new Date(clase.fechaCierre).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
            }
            
            const estadoIcono = clase.publicada ? '✅' : '⏸️';
            const estadoTexto = clase.publicada ? 'Publicada' : 'No publicada';
            const estadoClass = clase.publicada ? 'publicada' : 'no-publicada';
            
            let areaInfo = (!clase.area || clase.area === 'todas') 
                ? '<div class="clase-area">🌍 Área: Todas las áreas</div>'
                : `<div class="clase-area">👥 Área: ${this.escapeHtml(clase.area)}</div>`;

            // Info de modalidad
            let modalidadInfo = '';
            if (clase.modalidad) {
                const iconoMod = clase.modalidad === 'Presencial' ? '🏛️' : 
                                  clase.modalidad === 'Virtual' ? '💻' : '🔄';
                let detalles = '';
                if (clase.modalidad === 'Presencial' && clase.ubicacion) {
                    detalles = ` - 📍 ${this.escapeHtml(clase.ubicacion)}`;
                } else if (clase.modalidad === 'Virtual') {
                    if (clase.plataforma === 'Reunión virtual') {
                        detalles = ` - 🎥 Reunión virtual`;
                    } else if (clase.plataforma === 'YouTube' && clase.youtubeVideoId) {
                        detalles = ` - 📺 YouTube (ID: ${this.escapeHtml(clase.youtubeVideoId)})`;
                    }
                } else if (clase.modalidad === 'Híbrido') {
                    detalles = ` - 📍 ${this.escapeHtml(clase.ubicacion || 'N/A')} + 💻 ${this.escapeHtml(clase.plataforma || 'N/A')}`;
                }
                modalidadInfo = `<div class="clase-area">${iconoMod} Modalidad: ${this.escapeHtml(clase.modalidad)}${detalles}</div>`;
            }
            
            // Badges de controles internos
            const controlesInternos = [];
            if (clase.auditorio) controlesInternos.push('🏛️ Auditorio');
            if (clase.cafeteria) controlesInternos.push('☕ Cafetería');
            if (clase.material) controlesInternos.push('📦 Material');
            
            const badgeControles = controlesInternos.length > 0 ? 
                `<div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.85em;">
                    <span style="color: var(--text-muted);">🔧 Controles:</span>
                    ${controlesInternos.map(texto => 
                        `<span style="background: var(--bg-container); padding: 2px 10px; border-radius: 12px; border: 1px solid var(--border-color);">${texto}</span>`
                    ).join('')}
                </div>` : '';
            
            // Material enlaces
            const materialEnlaces = clase.materialEnlaces || [];
            const materialHTML = materialEnlaces.length > 0 ? 
                `<div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.85em; align-items: center;">
                    <span style="color: var(--text-muted);">📎 Material:</span>
                    ${materialEnlaces.map((enlace) => {
                        const tipo = this.detectarTipoEnlace(enlace.url);
                        const icono = tipo === 'youtube' ? '▶️' : tipo === 'drive' ? '📊' : '🔗';
                        const label = tipo === 'youtube' ? 'YouTube' : tipo === 'drive' ? 'Drive' : 'Enlace';
                        return `<a href="${enlace.url}" target="_blank" style="color: var(--accent-color); text-decoration: none; background: var(--bg-container); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">${icono} ${label}</a>`;
                    }).join(' ')}
                </div>` : '';
            
            const claseActiva = clase.activa === true || clase.publicada === true;
            
            let accionesHTML = `
                <button class="btn-small btn-edit" onclick="clasesPublicasManager.editarClase('${clase._id}')">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="clasesPublicasManager.eliminarClase('${clase._id}')">🗑️ Eliminar</button>
            `;
            
            if (claseActiva) {
                accionesHTML += `
                    <button class="btn-small btn-material" onclick="clasesPublicasManager.abrirModalMaterial('${clase._id}')">📎 Cargar material</button>
                `;
            }
            
            if (clase.publicada) {
                accionesHTML += `
                    <button class="btn-small btn-warning" onclick="clasesPublicasManager.cambiarVisibilidad('${clase._id}', false)">⏸️ Ocultar</button>
                `;
            } else {
                accionesHTML += `
                    <button class="btn-small btn-success" onclick="clasesPublicasManager.cambiarVisibilidad('${clase._id}', true)">✅ Publicar</button>
                `;
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
                    </div>
                    ${modalidadInfo}
                    ${areaInfo}
                    ${badgeControles}
                    ${materialHTML}
                    <div class="clase-enlaces">
                        ${clase.enlaceFormulario ? `<a href="${clase.enlaceFormulario}" target="_blank" class="material-link">📝 Ir a la clase</a>` : '<span class="sin-enlaces">Sin enlace de redirección</span>'}
                    </div>
                    <div class="clase-acciones">
                        ${accionesHTML}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // MANEJO DE MATERIAL
    // ============================================

    detectarTipoEnlace(url) {
        if (!url) return 'link';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'drive';
        return 'link';
    }

    abrirModalMaterial(claseId) {
        const clase = this.data.find(c => c._id === claseId);
        if (!clase) {
            alert('Clase no encontrada');
            return;
        }

        this.claseMaterialId = claseId;

        const modalHTML = `
            <div id="modalMaterial" class="modal-overlay" style="display: flex;">
                <div class="modal-container" style="max-width: 750px;">
                    <div class="modal-header">
                        <h2>📎 Cargar Material - ${clase.nombre}</h2>
                        <button class="close-modal" onclick="clasesPublicasManager.cerrarModalMaterial()">&times;</button>
                    </div>
                    <div class="modal-content" style="padding: 20px;">
                        <div id="materialMessage" class="message" style="display: none;"></div>
                        
                        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                            <p><strong>📅 Fecha:</strong> ${new Date(clase.fechaClase).toLocaleString('es-AR')}</p>
                            <p><strong>👥 Instructores:</strong> ${clase.instructores?.join(', ') || 'No especificados'}</p>
                            <p><strong>🎓 Modalidad:</strong> ${clase.modalidad || 'No especificada'}</p>
                        </div>
                        
                        <div id="materialLinksContainer"></div>
                        
                        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="clasesPublicasManager.agregarEnlaceMaterial()" class="btn btn-primary btn-small">➕ Agregar enlace</button>
                            <button onclick="clasesPublicasManager.guardarMaterial('${claseId}')" class="btn btn-success">💾 Guardar Material</button>
                            <button onclick="clasesPublicasManager.cerrarModalMaterial()" class="btn btn-secondary">❌ Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('modalMaterial');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.cargarEnlacesMaterial(claseId);
    }

    cargarEnlacesMaterial(claseId) {
        const container = document.getElementById('materialLinksContainer');
        if (!container) return;

        const clase = this.data.find(c => c._id === claseId);
        if (!clase) return;

        if (!clase.materialEnlaces) clase.materialEnlaces = [];

        if (clase.materialEnlaces.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted); border: 2px dashed var(--border-color); border-radius: 8px;">
                    No hay enlaces cargados. Haga clic en "Agregar enlace" para comenzar.
                </div>
            `;
            return;
        }

        container.innerHTML = clase.materialEnlaces.map((enlace, index) => {
            const tipo = this.detectarTipoEnlace(enlace.url);
            const icono = tipo === 'youtube' ? '▶️' : tipo === 'drive' ? '📊' : '🔗';
            
            return `
                <div class="enlace-item" style="display: flex; gap: 10px; align-items: center; padding: 10px; background: var(--bg-card); border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border-color);">
                    <span style="font-size: 1.2em;">${icono}</span>
                    <input type="url" value="${enlace.url}" 
                           placeholder="https://youtube.com/... o https://drive.google.com/..." 
                           style="flex: 1; padding: 8px; border: 2px solid var(--border-color); border-radius: 4px; background: var(--bg-input); color: var(--text-primary);"
                           onchange="clasesPublicasManager.actualizarEnlaceMaterial(${index}, this.value)">
                    <span style="font-size: 0.8em; color: var(--text-muted); min-width: 100px;">
                        ${tipo === 'youtube' ? '🎬 YouTube' : tipo === 'drive' ? '📄 Google Drive' : '🔗 Enlace'}
                    </span>
                    <button onclick="clasesPublicasManager.eliminarEnlaceMaterial(${index})" 
                            class="btn-small btn-danger" 
                            title="Eliminar enlace"
                            style="padding: 4px 8px;">🗑️</button>
                </div>
            `;
        }).join('');
    }

    agregarEnlaceMaterial() {
        const clase = this.data.find(c => c._id === this.claseMaterialId);
        if (!clase) return;
        if (!clase.materialEnlaces) clase.materialEnlaces = [];
        clase.materialEnlaces.push({ url: '' });
        this.cargarEnlacesMaterial(this.claseMaterialId);
    }

    actualizarEnlaceMaterial(index, url) {
        const clase = this.data.find(c => c._id === this.claseMaterialId);
        if (!clase || !clase.materialEnlaces) return;
        if (index >= 0 && index < clase.materialEnlaces.length) {
            clase.materialEnlaces[index].url = url;
            this.cargarEnlacesMaterial(this.claseMaterialId);
        }
    }

    eliminarEnlaceMaterial(index) {
        const clase = this.data.find(c => c._id === this.claseMaterialId);
        if (!clase || !clase.materialEnlaces) return;
        if (index >= 0 && index < clase.materialEnlaces.length) {
            clase.materialEnlaces.splice(index, 1);
            this.cargarEnlacesMaterial(this.claseMaterialId);
        }
    }

    async guardarMaterial(claseId) {
        const clase = this.data.find(c => c._id === claseId);
        if (!clase) return;

        const enlacesInvalidos = clase.materialEnlaces?.filter(e => e.url && !e.url.trim()) || [];
        if (enlacesInvalidos.length > 0) {
            this.mostrarMensajeModalMaterial('❌ Hay enlaces vacíos. Complete o elimine los enlaces vacíos.', 'error');
            return;
        }

        const enlacesValidos = clase.materialEnlaces?.filter(e => e.url && e.url.trim()) || [];

        try {
            const response = await authSystem.makeRequest(`/clases-publicas/${claseId}/material`, {
                materialEnlaces: enlacesValidos
            }, 'PUT');

            if (response.success) {
                this.mostrarMensajeModalMaterial('✅ Material guardado correctamente', 'success');
                clase.materialEnlaces = enlacesValidos;
                await this.cargarDatos();
                setTimeout(() => this.cerrarModalMaterial(), 1500);
            } else {
                throw new Error(response.message || 'Error al guardar material');
            }
        } catch (error) {
            console.error('❌ Error guardando material:', error);
            this.mostrarMensajeModalMaterial('❌ ' + error.message, 'error');
        }
    }

    mostrarMensajeModalMaterial(texto, tipo) {
        const msg = document.getElementById('materialMessage');
        if (!msg) return;
        msg.textContent = texto;
        msg.className = `message ${tipo}`;
        msg.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { msg.style.display = 'none'; }, 2000);
        }
    }

    cerrarModalMaterial() {
        const modal = document.getElementById('modalMaterial');
        if (modal) modal.remove();
        this.claseMaterialId = null;
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