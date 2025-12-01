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
            headers: { 'Content-Type': 'application/json' },
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
    navigateTo('experiencias-view');
});