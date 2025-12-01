// --- VARIABLES GLOBALES ---
let usuarioActualEmail = localStorage.getItem('email');
let experienciaSeleccionada = {};
function validarSesion() {
    if (!localStorage.getItem('email')) {
        alert('Iniciar Sesion');
        window.location.href = 'index.html';
    } else {
        usuarioActualEmail = localStorage.getItem('email');
    }
}

validarSesion()

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
    validarSesion();
    const datosPago = {
        usuarioEmail: usuarioActualEmail,
        propietario: document.getElementById('propietario-text').value,
        tarjeta: document.getElementById('tarjeta-text').value,
        cvv: document.getElementById('cvv-pass').value,
        vencimiento: document.getElementById('vencimiento-text').value
    };

    try {
        const res = await fetch('/api/pagar-experiencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPago)
        });
        const data = await res.json();

        if (data.success) {
            // Generar y Mostrar ID de reserva
            //document.getElementById('conf-id').innerText = data.reservaId;
            //navigateTo('confirmacion-view');
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