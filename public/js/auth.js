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
            localStorage.setItem('email', email);
            alert('Bienvenido ' + data.nombre);
            
            // Redirección por rol
            if (data.rol === 'admin') window.location.href = "admin.html";
            else if (data.rol === 'proveedor') window.location.href = "proveedor.html";
            else window.location.href = "visitante.html";
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
