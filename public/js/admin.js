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
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

async function cargarExperienciasAdmin() {
    const tbody = document.getElementById('admin-experiencias-list');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Cargando experiencias...</td></tr>';

    try {
        const res = await fetch('/api/experiencias');
        if (!res.ok) throw new Error('Error al obtener experiencias');
        const experiencias = await res.json();

        if (!Array.isArray(experiencias) || experiencias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay experiencias registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        experiencias.forEach(exp => {
            const tr = document.createElement('tr');
            const proveedorNombre =
                (exp.proveedor && exp.proveedor.nombre) ||
                exp.proveedorEmail ||
                'Proveedor';

            tr.innerHTML = `
                <td>${exp.nombre}</td>
                <td>${proveedorNombre}</td>
                <td>${exp.ubicacion}</td>
                <td>${exp.cupo}</td>
                <td>${exp.descripcion}</td>
                <td>
                  <button class="btn-danger" data-id="${exp._id}">Borrar</button>
                </td>
            `;

            const btnDelete = tr.querySelector('.btn-danger');
            btnDelete.addEventListener('click', () => borrarExperiencia(exp._id, exp.nombre));

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6">Error cargando experiencias.</td></tr>';
    }
}



// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('admin-view');
    cargarExperienciasAdmin();
});
