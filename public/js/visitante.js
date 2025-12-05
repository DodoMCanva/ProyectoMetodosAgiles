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
        // Si vamos a la vista de reservaciones, renderizarlas
        if (viewId === 'mis-reservas-view') renderMisReservasList();
    }
}

// --- LÓGICA DE RESERVA ---

// Paso 1: Seleccionar tarjeta (Esto se llama desde el HTML onclick)
function seleccionarExperiencia(titulo, proveedor, precio, fecha, id) {
    experienciaSeleccionada = { titulo, proveedor, precio, fecha, id };

    // Llenar vista detalle con los datos recibidos
    document.getElementById('detail-title').innerText = titulo;
    document.getElementById('detail-provider').innerText = 'Por ' + proveedor;
    document.getElementById('detail-price').innerText = '$' + precio;

    navigateTo('detalle-view');
}

// Renderiza las experiencias desde el servidor
async function renderExperienciasList() {
    const grid = document.querySelector('.experiences-grid');
    if (!grid) return;
    grid.innerHTML = '';

    try {
        const res = await fetch('/api/experiencias');
        if (!res.ok) throw new Error('No se pudo obtener experiencias');
        const experiencias = await res.json();

        if (!Array.isArray(experiencias) || experiencias.length === 0) {
            grid.innerHTML = '<p>No hay experiencias disponibles.</p>';
            return;
        }

        experiencias.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'experience-card';
            const precio = exp.precio || 0;
            const proveedorNombre = (exp.proveedor && exp.proveedor.nombre) || exp.proveedorEmail || 'Proveedor local';
            const fechaTexto = exp.fecha ? new Date(exp.fecha).toLocaleDateString('es-ES') : '';
            card.innerHTML = `
                <div class="card-image">
                    <div class="card-emoji">${exp.imagen ? '<img src="'+escapeHtml(exp.imagen)+'" alt="img" style="max-width:64px;max-height:64px;object-fit:cover;">' : '📍'}</div>
                    <span class="card-badge">${escapeHtml(exp.ubicacion || '')}</span>
                </div>
                <div class="card-content">
                    <h3>${escapeHtml(exp.nombre)}</h3>
                    <p class="provider">Por ${escapeHtml(proveedorNombre)}</p>
                    <div class="card-footer">
                        <div class="price">$${precio}</div>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => seleccionarExperiencia(exp.nombre, proveedorNombre, precio, fechaTexto, exp._id || exp.id));
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p>Error cargando experiencias.</p>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"]/g, function (m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m];
    });
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
    if (!experienciaSeleccionada || !experienciaSeleccionada.id) {
        alert('No hay una experiencia seleccionada.');
        navigateTo('experiencias-view');
        return;
    }

    const datosPago = {
        usuarioEmail: usuarioActualEmail,
        propietario: document.getElementById('propietario-text').value,
        tarjeta: document.getElementById('tarjeta-text').value,
        cvv: document.getElementById('cvv-pass').value,
        vencimiento: document.getElementById('vencimiento-text').value,
        experienciaId: experienciaSeleccionada.id,
        total: experienciaSeleccionada.total || experienciaSeleccionada.precio || 0
    };

    try {
        const res = await fetch('/api/pagar-experiencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPago)
        });
        const data = await res.json();

        if (data.success) {
            // Mostrar ID de reserva y navegar a confirmación
            if (data.reservaId) document.getElementById('conf-id').innerText = data.reservaId;
            navigateTo('confirmacion-view');
        } else {
            alert('Error al reservar: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error procesando pago');
    }
}

// Mostrar las reservaciones del usuario
async function renderMisReservasList() {
    const container = document.getElementById('reservas-list');
    if (!container) return;
    container.innerHTML = '<p>Cargando reservaciones...</p>';

    try {
        const res = await fetch(`/api/reservaciones?usuarioEmail=${encodeURIComponent(usuarioActualEmail)}`);
        if (!res.ok) throw new Error('Error obteniendo reservaciones');
        const reservas = await res.json();
        if (!Array.isArray(reservas) || reservas.length === 0) {
            container.innerHTML = '<p>No tienes reservaciones.</p>';
            return;
        }

        container.innerHTML = '';
        reservas.forEach(r => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            const exp = r.experiencia || {};
            const fechaExp = exp.fecha ? new Date(exp.fecha).toLocaleDateString('es-ES') : '';
            card.innerHTML = `
                <h4>${escapeHtml(exp.nombre || '—')}</h4>
                <p>${escapeHtml(exp.ubicacion || '')} • ${fechaExp}</p>
                <p><strong>Total:</strong> $${r.total}</p>
                <p><strong>Estado:</strong> ${escapeHtml(r.status)}</p>
                <p><small>ID Reserva: ${r._id}</small></p>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p>Error cargando reservaciones.</p>';
    }
}


// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, mandamos al login
    renderExperienciasList();
    navigateTo('experiencias-view');
});