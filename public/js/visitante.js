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

validarSesion();

// --- NAVEGACIÓN ---
function navigateTo(viewId) {
    if (viewId === "login-view") {
        localStorage.clear();
        window.location.href = "index.html";
        return;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
        // Si vamos a la vista de reservaciones, renderizarlas
        if (viewId === 'mis-reservas-view') renderMisReservasList();
    }
}

// --- LÓGICA DE RESERVA ---

// Paso 1: Seleccionar tarjeta
function seleccionarExperiencia(titulo, proveedor, precio, fecha, descripcion, cupo, id) {
    experienciaSeleccionada = { titulo, proveedor, precio, fecha, descripcion, cupo, id };

    document.getElementById('detail-title').innerText = titulo;
    document.getElementById('detail-provider').innerText = 'Por ' + proveedor;
    document.getElementById('detail-price').innerText = '$' + precio;
    document.getElementById('detail-description').innerText = descripcion;
    document.getElementById('detail-space').innerText = cupo;

    navigateTo('detalle-view');
}

// Renderiza las experiencias desde el servidor, con filtros
async function renderExperienciasList() {
    const grid = document.querySelector('.experiences-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const switchLocal = document.getElementById('switch-local');
    const filtroUbicacion = document.getElementById('filtro-ubicacion');

    const useLocalFilter = switchLocal?.checked;
    const ubicacion = filtroUbicacion?.value || '';

    let url = '/api/experiencias';
    if (useLocalFilter && ubicacion) {
        const params = new URLSearchParams({ ubicacion });
        url = `/api/experiencias?${params.toString()}`;
    }
    console.log('useLocalFilter:', useLocalFilter, 'ubicacion:', ubicacion, 'url:', url);

    try {
        const res = await fetch(url);
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
            const proveedorNombre =
                (exp.proveedor && exp.proveedor.nombre) ||
                exp.proveedorEmail ||
                'Proveedor local';
            const fechaTexto = exp.fecha
                ? new Date(exp.fecha).toLocaleDateString('es-ES')
                : '';

            card.innerHTML = `
                <div class="card-image">
                    <div class="card-emoji">
                        ${exp.imagen
                    ? '<img src="' + escapeHtml(exp.imagen) + '" alt="img" style="max-width:64px;max-height:64px;object-fit:cover;">'
                    : '📍'}
                    </div>
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

            card.addEventListener('click', () =>
                seleccionarExperiencia(
                    exp.nombre,
                    proveedorNombre,
                    precio,
                    fechaTexto,
                    exp.descripcion || '',
                    exp.cupo,
                    exp._id || exp.id
                )
            );



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
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m];
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

    document.getElementById('pay-title').innerText = experienciaSeleccionada.titulo;
    document.getElementById('pay-provider').innerText = 'Por ' + experienciaSeleccionada.proveedor;
    document.getElementById('pay-total').innerText = '$' + total;
    document.querySelector('.btn-pay').innerText = `Pagar $${total}`;

    navigateTo('pago-view');
}

// Paso 3: Procesar pago
async function procesarPago() {
    validarSesion();
    if (!experienciaSeleccionada || !experienciaSeleccionada.id) {
        alert('No hay una experiencia seleccionada.');
        navigateTo('experiencias-view');
        return;
    }

    const datosPago = {
        usuarioEmail: usuarioActualEmail,
        experienciaId: experienciaSeleccionada.id,
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

// Renderizar las reservaciones del usuario
async function renderMisReservasList() {
    validarSesion();
    const lista = document.getElementById('reservas-list');
    if (!lista) return;
    lista.innerHTML = '';

    const usuario = usuarioActualEmail;
    if (!usuario) {
        lista.innerHTML = '<p>No se encontró usuario. Inicia sesión.</p>';
        return;
    }

    try {
        const params = new URLSearchParams({ usuarioEmail: usuario });
        const res = await fetch(`/api/reservaciones?${params.toString()}`);
        if (!res.ok) throw new Error('Error al obtener reservaciones');
        const reservas = await res.json();

        if (!Array.isArray(reservas) || reservas.length === 0) {
            lista.innerHTML = '<p>No tienes reservaciones aún.</p>';
            return;
        }

        reservas.forEach(r => {
            const exp = r.experiencia || {};
            const cont = document.createElement('div');
            cont.className = 'reserva-card';

            const fechaTexto = exp.fecha ? new Date(exp.fecha).toLocaleString('es-ES') : '';
            cont.innerHTML = `
                <div class="reserva-header">
                    <strong>${escapeHtml(exp.nombre || 'Sin nombre')}</strong>
                    <span class="reserva-id">#${escapeHtml(String(r._id || r.id || ''))}</span>
                </div>
                <div class="reserva-body">
                    <div>Fecha: ${escapeHtml(fechaTexto)}</div>
                    <div>Ubicación: ${escapeHtml(exp.ubicacion || '')}</div>
                    <div>Monto: $${escapeHtml(String(r.total || exp.precio || 0))}</div>
                    <div>Estado: ${escapeHtml(r.status || 'desconocido')}</div>
                </div>
            `;

            lista.appendChild(cont);
        });
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p>Error cargando tus reservaciones.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderExperienciasList();
    navigateTo('experiencias-view');

    const switchLocal = document.getElementById('switch-local');
    const filtroUbicacion = document.getElementById('filtro-ubicacion');

    if (switchLocal) {
        switchLocal.addEventListener('change', () => {
            console.log('switch-local checked:', switchLocal.checked);
            renderExperienciasList();
        });
    }

    if (filtroUbicacion) {
        filtroUbicacion.addEventListener('change', () => {
            console.log('ubicacion seleccionada:', filtroUbicacion.value);
            renderExperienciasList();
        });
    }
});
