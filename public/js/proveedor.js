// --- VARIABLES GLOBALES ---
let usuarioActualEmail = localStorage.getItem('email');
let experienciaSeleccionada = {};
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

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, mandamos al login
    navigateTo('proveedor-view');
});