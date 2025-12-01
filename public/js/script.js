// --- VARIABLES GLOBALES ---
let usuarioActualEmail = '';
let experienciaSeleccionada = {};

// --- NAVEGACIÓN ---
function navigateTo(viewId) {
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

// --- AUTENTICACIÓN ---
async function handleLogin() {
    const emailInput = document.querySelector('#login-form input[type="email"]');
    const passInput = document.querySelector('#login-form input[type="password"]');
    
    const email = emailInput.value;
    const password = passInput.value;

    if (!email || !password) {
        alert("Ingresa correo y contraseña");
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            // Guardamos el email para poder reservar después
            usuarioActualEmail = email;
            alert('Bienvenido ' + data.nombre);
            
            // Redirección por rol
            if (data.rol === 'admin') navigateTo('admin-view');
            else if (data.rol === 'proveedor') navigateTo('proveedor-view');
            else navigateTo('experiencias-view');
        } else {
            alert(data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function handleRegister() {
    const container = document.getElementById('register-form');
    // Obtenemos los valores de los inputs dentro del formulario de registro
    const nombre = container.querySelector('input[placeholder="Tu Nombre"]').value;
    const email = container.querySelector('input[placeholder="tu@correo.com"]').value;
    // Buscamos todos los passwords en el registro (el primero es pass, el segundo confirmar)
    const inputsPass = container.querySelectorAll('input[type="password"]');
    const pass = inputsPass[0].value;
    const confirm = inputsPass[1].value;
    const rol = container.querySelector('select').value;

    if (!nombre || !email || !pass) return alert("Completa los campos");
    if (pass !== confirm) return alert("Las contraseñas no coinciden");

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre, email, password: pass, rol })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Cuenta creada. Inicia sesión.');
            switchAuthTab('login');
        } else {
            alert(data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error de registro');
    }
}

// --- LÓGICA DE RESERVA ---

// Paso 1: Seleccionar tarjeta (Esto se llama desde el HTML onclick)
function seleccionarExperiencia(titulo, proveedor, precio, fecha) {
    experienciaSeleccionada = { titulo, proveedor, precio, fecha };

    // Llenar vista detalle con los datos recibidos
    document.getElementById('detail-title').innerText = titulo;
    document.getElementById('detail-provider').innerText = 'Por ' + proveedor;
    document.getElementById('detail-price').innerText = '$' + precio;

    navigateTo('detalle-view');
}

// Paso 2: Ir a pagar
function prepararPago() {
    if (!usuarioActualEmail) {
        alert("Tu sesión expiró o no has iniciado sesión. Por favor entra de nuevo.");
        navigateTo('login-view');
        return;
    }

    const total = experienciaSeleccionada.precio;
    experienciaSeleccionada.total = total;
    experienciaSeleccionada.personas = 1;

    // Llenar vista pago
    document.getElementById('pay-title').innerText = experienciaSeleccionada.titulo;
    document.getElementById('pay-provider').innerText = 'Por ' + experienciaSeleccionada.proveedor;
    document.getElementById('pay-total').innerText = '$' + total;
    document.querySelector('.btn-pay').innerText = `Pagar $${total}`;

    navigateTo('pago-view');
}

// Paso 3: Procesar pago y guardar en Base de Datos
async function procesarPago() {
    const datosReserva = {
        usuarioEmail: usuarioActualEmail,
        ...experienciaSeleccionada
    };

    try {
        const res = await fetch('/api/reservar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datosReserva)
        });
        const data = await res.json();

        if (data.success) {
            // Mostrar ID de reserva
            document.getElementById('conf-id').innerText = data.reservaId;
            navigateTo('confirmacion-view');
        } else {
            alert('Error al reservar: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error procesando pago');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, mandamos al login
    navigateTo('login-view');
});