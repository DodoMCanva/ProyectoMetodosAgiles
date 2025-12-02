const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/experiencias_db')
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Configuración para recibir JSON y servir archivos estáticos
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Definición del Modelo Usuario
const UsuarioSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true, required: true },
    password: String,
    rol: { type: String, default: 'visitante' }
});

const ExperienciaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: Date, required: true },
    cupo: { type: Number, required: true },
    precio: { type: Number, required: true },
    ubicacion: { type: String, required: true },

    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
});

const Experiencia = mongoose.model('Experiencia', ExperienciaSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Ruta para crear datos de prueba iniciales
app.get('/api/setup', async (req, res) => {
    try {
        await Usuario.deleteMany({});
        await Usuario.create([
            { nombre: 'Admin', email: 'admin@test.com', password: '123', rol: 'admin' }
        ]);
        res.send('Usuarios de prueba creados correctamente');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// Ruta para Iniciar Sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Usuario.findOne({ email });

        if (user && user.password === password) {
            res.json({ success: true, rol: user.rol, nombre: user.nombre });
        } else {
            res.json({ success: false, message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta para REGISTRAR un nuevo usuario
app.post('/api/register', async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        // 1. Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.json({ success: false, message: 'Este correo ya está registrado' });
        }

        // 2. Crear el nuevo usuario
        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password,
            rol: rol || 'visitante' // Si no eligen rol, es visitante por defecto
        });

        // 3. Guardar en MongoDB
        await nuevoUsuario.save();

        res.json({ success: true, message: 'Usuario creado con éxito' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
});


// Crear experiencia (RESTful, acepta proveedorEmail o proveedor)
app.post('/api/experiencias', async (req, res) => {
    try {
        const { nombre, descripcion, fecha, cupo, precio, ubicacion, imagen, proveedorEmail, proveedor } = req.body;
        if (!nombre || !descripcion || !fecha || !cupo || precio === undefined || !ubicacion || (!proveedorEmail && !proveedor)) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        let proveedorObj = null;
        if (proveedorEmail) {
            proveedorObj = await Usuario.findOne({ email: proveedorEmail });
            if (!proveedorObj) return res.status(400).json({ success: false, message: 'Proveedor no encontrado' });
        }

        const nuevaExp = new Experiencia({
            nombre,
            descripcion,
            fecha,
            cupo,
            precio,
            ubicacion,
            imagen: imagen || '',
            proveedor: proveedorObj ? proveedorObj._id : proveedor
        });

        await nuevaExp.save();
        res.status(201).json({ success: true, message: 'Experiencia creada', experiencia: nuevaExp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear experiencia' });
    }
});

app.post('/api/pagar-experiencia', async (req, res) => {
    try {
        const { usuarioEmail, propietario, tarjeta, cvv, vencimiento } = req.body;

        if (!usuarioEmail || !propietario || !tarjeta || !cvv || !vencimiento) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios para procesar el pago'
            });
        }

        if (!usuarioEmail.includes('@')) {
            return res.status(400).json({ success: false, message: 'Email inválido' });
        }

        if (tarjeta.length < 13 || tarjeta.length > 19) {
            return res.status(400).json({ success: false, message: 'Número de tarjeta inválido' });
        }

        if (cvv.length < 3 || cvv.length > 4) {
            return res.status(400).json({ success: false, message: 'CVV inválido' });
        }

        res.json({ success: true, message: 'Experiencia pagada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'No se pudo pagar la experiencia' });
    }
});

// Obtener todas las experiencias (RESTful)
app.get('/api/experiencias', async (req, res) => {
    try {
        // Permitir filtrar por proveedor (opcional)
        const filtro = {};
        if (req.query.proveedorEmail) {
            const prov = await Usuario.findOne({ email: req.query.proveedorEmail });
            if (prov) filtro.proveedor = prov._id;
        }
        const experiencias = await Experiencia.find(filtro).populate('proveedor', 'email nombre');
        res.json(experiencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener experiencias' });
    }
});


// Editar experiencia por ID
app.put('/api/experiencias/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha, cupo, precio, ubicacion } = req.body;
    try {
        const exp = await Experiencia.findById(id);
        if (!exp) return res.status(404).json({ success: false, message: 'Experiencia no encontrada' });

        if (nombre !== undefined) exp.nombre = nombre;
        if (descripcion !== undefined) exp.descripcion = descripcion;
        if (fecha !== undefined) exp.fecha = fecha;
        if (cupo !== undefined) exp.cupo = cupo;
        if (precio !== undefined) exp.precio = precio;
        if (ubicacion !== undefined) exp.ubicacion = ubicacion;

        await exp.save();
        res.json({ success: true, message: 'Experiencia actualizada', experiencia: exp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar experiencia' });
    }
});

// Eliminar experiencia por ID
app.delete('/api/experiencias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const exp = await Experiencia.findByIdAndDelete(id);
        if (!exp) return res.status(404).json({ success: false, message: 'Experiencia no encontrada' });
        res.json({ success: true, message: 'Experiencia eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar experiencia' });
    }
});


// --- RUTA DE VERIFICACIÓN (Solo para pruebas) ---
app.get('/api/ver-usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        res.status(500).send('Error al consultar usuarios');
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});