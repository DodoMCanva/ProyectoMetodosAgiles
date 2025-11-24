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

// Manejar el login conectando con el Servidor
async function handleLogin() {
    // Seleccionamos los inputs especificos del formulario de login
    const emailInput = document.querySelector('#login-form input[type="email"]');
    const passwordInput = document.querySelector('#login-form input[type="password"]');
    
    const email = emailInput.value;
    const password = passwordInput.value;

    // Validación simple para no enviar vacíos
    if (!email || !password) {
        alert("Por favor ingresa correo y contraseña");
        return;
    }

    try {
        // Hacemos la petición al backend
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // Si el servidor dice que es correcto
        if (data.success) {
            alert('Bienvenido: ' + data.nombre);
            
            // Redirigir según el rol que viene de la Base de Datos
            if (data.rol === 'admin') {
                navigateTo('admin-view');
            } else if (data.rol === 'proveedor') {
                navigateTo('proveedor-view');
            } else {
                navigateTo('experiencias-view');
            }
        } else {
            // Si la contraseña o correo están mal
            alert('Error: ' + data.message);
        }

    } catch (error) {
        console.error(error);
        alert('Error al conectar con el servidor');
    }
}

// NUEVA FUNCIÓN: Manejar el Registro de usuarios
async function handleRegister() {
    // Seleccionar inputs buscando dentro del div #register-form
    const registerContainer = document.getElementById('register-form');
    
    // Obtenemos los valores
    const nombre = registerContainer.querySelector('input[type="text"]').value;
    const email = registerContainer.querySelector('input[type="email"]').value;
    
    // Hay dos inputs de password (contraseña y confirmar), obtenemos ambos
    const passwordInputs = registerContainer.querySelectorAll('input[type="password"]');
    const password = passwordInputs[0].value;
    const confirmPassword = passwordInputs[1].value;
    
    const rol = registerContainer.querySelector('select').value;

    // Validaciones
    if (!nombre || !email || !password) {
        alert("Por favor completa todos los campos");
        return;
    }

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        // Enviar datos al servidor
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        const data = await response.json();

        if (data.success) {
            alert('Cuenta creada con éxito. Por favor inicia sesión.');
            // Cambiar a la pestaña de Login
            switchAuthTab('login');
        } else {
            alert('Error: ' + data.message);
        }

    } catch (error) {
        console.error(error);
        alert('Error al conectar con el servidor');
    }
}

// Inicializar la aplicación mostrando la vista de login
document.addEventListener('DOMContentLoaded', function() {
    navigateTo('login-view');
});