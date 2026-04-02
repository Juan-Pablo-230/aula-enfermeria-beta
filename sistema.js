class SistemaFormularios {
    constructor() {
        this.auth = authSystem;
        // URL dinámica para Railway
        this.apiBaseUrl = window.location.origin + '/api';
        console.log('🌐 Sistema inicializado con URL:', this.apiBaseUrl);
    }

    async makeRequest(endpoint, data = null, method = 'POST') {
        try {
            const user = this.auth.getCurrentUser();
            const options = {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': user?._id || ''
                }
            };
            
            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            
            console.log('🌐 Haciendo request a:', `${this.apiBaseUrl}${endpoint}`);
            console.log('👤 User ID:', user?._id || 'No logueado');
            
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `Error ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('Error en makeRequest:', error);
            throw error;
        }
    }

    async verificarInscripcion(usuarioId, clase) {
        const result = await this.makeRequest(
            `/inscripciones/verificar/${usuarioId}/${encodeURIComponent(clase)}`, 
            null, 
            'GET'
        );
        return result.data.exists;
    }

    async crearInscripcion(datos) {
        return await this.makeRequest('/inscripciones', datos);
    }

    async obtenerInscripciones(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        return await this.makeRequest(`/inscripciones?${params}`, null, 'GET');
    }

    async obtenerEstadisticas() {
        return await this.makeRequest('/inscripciones/estadisticas', null, 'GET');
    }

    async obtenerUsuarios() {
        return await this.makeRequest('/admin/usuarios', null, 'GET');
    }

    async crearUsuario(datos) {
        return await this.makeRequest('/admin/usuarios', datos);
    }

    async cambiarRol(usuarioId, nuevoRol) {
        return await this.makeRequest(`/admin/usuarios/${usuarioId}/rol`, { role: nuevoRol }, 'PUT');
    }

    async eliminarUsuario(usuarioId) {
        return await this.makeRequest(`/admin/usuarios/${usuarioId}`, null, 'DELETE');
    }

    async obtenerDashboard() {
        return await this.makeRequest('/admin/dashboard', null, 'GET');
    }

    async obtenerPerfil() {
        return await this.makeRequest('/usuarios/perfil', null, 'GET');
    }

    async actualizarPerfil(datos) {
        return await this.makeRequest('/usuarios/perfil', datos, 'PUT');
    }

    async eliminarCuenta(datos) {
        return await this.makeRequest('/usuarios/cuenta', datos, 'DELETE');
    }
}

const sistema = new SistemaFormularios();