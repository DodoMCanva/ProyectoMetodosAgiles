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
    // Si no hay correo de usuario en localStorage, usar un demo temporal
    if (!usuarioActualEmail) {
        usuarioActualEmail = 'proveedor_demo@example.com';
        localStorage.setItem('email', usuarioActualEmail);
    }
    navigateTo('proveedor-view');
    renderExperienciasList();
});

// ---- Funciones para crear experiencia (front) ----
function openCreateExperienceForm() {
    const form = document.getElementById('create-experience-form');
    if (form) form.style.display = 'block';
    const btn = document.getElementById('btn-open-create');
    if (btn) btn.style.display = 'none';
    const feedback = document.getElementById('create-feedback');
    if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
}

function closeCreateExperienceForm() {
    const form = document.getElementById('create-experience-form');
    if (form) form.style.display = 'none';
    const btn = document.getElementById('btn-open-create');
    if (btn) btn.style.display = 'inline-block';
}

async function handleCreateExperienceSubmit() {
    const nombre = document.getElementById('exp-nombre').value.trim();
    const descripcion = document.getElementById('exp-descripcion').value.trim();
    const fecha = document.getElementById('exp-fecha').value;
    const cupo = parseInt(document.getElementById('exp-cupo').value, 10);
    const precio = parseFloat(document.getElementById('exp-precio').value);
    const ubicacion = document.getElementById('exp-ubicacion').value.trim();
    const imagen = document.getElementById('exp-imagen').value.trim();

    const feedback = document.getElementById('create-feedback');

    // Validación básica
    if (!nombre || !descripcion || !fecha || !cupo || isNaN(precio) || !ubicacion) {
        if (feedback) { feedback.style.display = 'block'; feedback.style.color = 'crimson'; feedback.textContent = 'Por favor complete todos los campos obligatorios.'; }
        return;
    }

    const experiencia = {
        id: 'exp_' + Date.now(),
        nombre,
        descripcion,
        fecha,
        cupo,
        precio,
        ubicacion,
        imagen: imagen || null,
        proveedorEmail: usuarioActualEmail,
        creadoEn: new Date().toISOString()
    };

    // Intentar guardar en backend; si falla, guardar localmente
    const saved = await saveExperienceToServer(experiencia);
    if (saved) {
        if (feedback) { feedback.style.display = 'block'; feedback.style.color = 'green'; feedback.textContent = 'Experiencia guardada en el servidor.'; }
    } else {
        saveExperienceLocally(experiencia);
        if (feedback) { feedback.style.display = 'block'; feedback.style.color = 'orange'; feedback.textContent = 'No fue posible contactar al servidor — experiencia guardada localmente.'; }
    }

    // limpiar y re-render
    document.getElementById('create-experience-form').reset();
    closeCreateExperienceForm();
    renderExperienciasList();
}

async function saveExperienceToServer(exp) {
    try {
        const res = await fetch('/api/experiencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exp)
        });
        if (res.ok) return true;
        // si responde con error, devolver false para fallback
        return false;
    } catch (err) {
        // error de red
        return false;
    }
}

function saveExperienceLocally(exp) {
    const key = 'mis_experiencias_proveedor_' + usuarioActualEmail;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(exp);
    localStorage.setItem(key, JSON.stringify(arr));
}

function getLocalExperiences() {
    const key = 'mis_experiencias_proveedor_' + usuarioActualEmail;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function renderExperienciasList() {
    const container = document.getElementById('experiencias-list');
    if (!container) return;
    container.innerHTML = '';

    // cargar locales primero
    const locales = getLocalExperiences();
    if (locales.length === 0) {
        container.innerHTML = '<p>No hay experiencias registradas.</p>';
        return;
    }

    locales.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'experience-card small-card';
        card.innerHTML = `
            <div class="card-image" style="background:#eee;min-width:72px;display:flex;align-items:center;justify-content:center;">
                <div>${exp.imagen ? `<img src="${exp.imagen}" alt="img" style="max-width:72px;max-height:72px;object-fit:cover;">` : '📍'}</div>
            </div>
            <div class="card-content">
                <h4>${escapeHtml(exp.nombre)}</h4>
                <p style="font-size:0.9rem;margin:4px 0;">${escapeHtml(exp.descripcion.substring(0, 100))}${exp.descripcion.length>100? '...':''}</p>
                <div class="card-footer">
                    <small>${escapeHtml(exp.fecha)} • ${escapeHtml(exp.ubicacion)}</small>
                    <div style="float:right;"><strong>$${exp.precio}</strong></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m];
    });
}