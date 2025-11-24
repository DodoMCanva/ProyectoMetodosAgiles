// Sistema de navegación entre vistas
function navigateTo(viewId) {
    // Ocultar todas las vistas
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
    });

    // Mostrar la vista seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// Cambiar entre tabs de Login y Registro
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Manejar el login y redirigir según tipo de usuario
function handleLogin() {
    const userType = document.getElementById('login-user-type').value;

    if (userType === 'admin') {
        navigateTo('admin-view');
    } else if (userType === 'proveedor') {
        navigateTo('proveedor-view');
    } else {
        navigateTo('experiencias-view');
    }
}

// Inicializar la aplicación mostrando la vista de login
document.addEventListener('DOMContentLoaded', function() {
    navigateTo('login-view');
});
