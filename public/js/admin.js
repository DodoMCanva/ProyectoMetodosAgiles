// --- VARIABLES GLOBALES ---

let usuarioActualEmail = '';
let experienciaSeleccionada = {};

if (!localStorage.getItem('email')) {
    alert('Iniciar Sesion');
    window.location.href = 'index.html';
} else {
    usuarioActualEmail = localStorage.getItem('email');
}

// --- NAVEGACIÓN ---
function navigateTo(viewId) {
    if (viewId === "login-view") {
        localStorage.clear();
        window.location.href = "index.html";
        return;
    }
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // Mostrar la vista deseada
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, mandamos al login
    navigateTo('admin-view');
});