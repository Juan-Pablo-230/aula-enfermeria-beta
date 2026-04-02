// navigation-cleaner.js
console.log('🧹 Navigation Cleaner para Dashboard');

class NavigationCleaner {
    constructor() {
        this.init();
    }

    init() {
        // Limpiar inmediatamente
        this.limpiarContenidoResidual();
        
        // Observar cambios en el DOM
        this.observer = new MutationObserver(() => {
            this.limpiarContenidoResidual();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Navigation Cleaner activado en Dashboard');
    }

    limpiarContenidoResidual() {
        // Solo ejecutar si NO estamos en dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            return; // No limpiar en dashboard
        }

        const pageContent = document.getElementById('page-content');
        
        // Si no hay contenedor principal, no hacer nada
        if (!pageContent) return;

        const currentPage = pageContent.dataset.page;
        
        // Lista de selectores de elementos específicos del dashboard
        const selectoresDashboard = [
            '.admin-container',
            '.admin-header',
            '.view-navigation',
            '.stats-container',
            '.filtros-container',
            '.actions-bar',
            '.table-container',
            '#inscripcionesSection',
            '#usuariosSection',
            '#materialSection',
            '#materialHistoricoSection',
            '#gestionClasesVisualSection',
            '.gestion-container',
            '.form-panel',
            '.list-panel'
        ];

        // Solo limpiar si estamos en una página que NO es dashboard
        if (currentPage && currentPage !== 'dashboard') {
            console.log(`📄 Página actual: ${currentPage} - Limpiando elementos del dashboard`);
            
            // Eliminar elementos del dashboard
            selectoresDashboard.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    console.log('🧹 Eliminando elemento del dashboard:', selector);
                    el.remove();
                });
            });
            
            // Limpiar el contenido del page-content
            this.limpiarPageContent(pageContent, currentPage);
        }
    }

    limpiarPageContent(pageContent, paginaActual) {
        // Mantener solo los elementos que pertenecen a la página actual
        const hijos = Array.from(pageContent.children);
        
        hijos.forEach(hijo => {
            // No eliminar el título de la página si existe
            if (hijo.matches('h1, h2, .page-title')) {
                return;
            }
            
            // Si el hijo parece ser del dashboard, eliminarlo
            if (hijo.matches('.admin-container, .view-navigation, .stats-container')) {
                console.log('🧹 Limpiando contenido del dashboard en page-content');
                hijo.remove();
            }
        });
    }
}

// Inicializar el cleaner cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.navigationCleaner = new NavigationCleaner();
});