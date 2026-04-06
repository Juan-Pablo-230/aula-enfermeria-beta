const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Importar desde la raíz (ajustar paths)
const { connectToDatabase, getDB, mongoDB } = require('../database');

const app = express();

// ==================== FUNCIONES DE HASH CON SCRYPT ====================

// Configuración de scrypt (optimizada para Vercel)
const SCRYPT_CONFIG = {
    N: 8192,
    r: 8,
    p: 1,
    keyLength: 32,
    saltLength: 16
};

function hashPasswordScrypt(password) {
    const salt = crypto.randomBytes(SCRYPT_CONFIG.saltLength);
    const hash = crypto.scryptSync(password, salt, SCRYPT_CONFIG.keyLength, {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p
    });
    return `scrypt|${SCRYPT_CONFIG.N}|${SCRYPT_CONFIG.r}|${SCRYPT_CONFIG.p}|${salt.toString('base64')}|${hash.toString('base64')}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash.includes('|') && storedHash.length < 64) {
        return storedHash === password;
    }
    
    if (storedHash.startsWith('scrypt|')) {
        const parts = storedHash.split('|');
        if (parts.length === 6 && parts[0] === 'scrypt') {
            const N = parseInt(parts[1]);
            const r = parseInt(parts[2]);
            const p = parseInt(parts[3]);
            const salt = Buffer.from(parts[4], 'base64');
            const hashGuardado = Buffer.from(parts[5], 'base64');
            
            const hashCalculado = crypto.scryptSync(password, salt, hashGuardado.length, {
                N: N,
                r: r,
                p: p
            });
            
            return crypto.timingSafeEqual(hashGuardado, hashCalculado);
        }
    }
    return false;
}

function hashPassword(password) {
    return hashPasswordScrypt(password);
}

// ==================== MIDDLEWARES ====================
app.use(cors());
app.use(express.json());

// ==================== HEALTH CHECKS ====================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString(),
        mongoDB: mongoDB.isConnected ? 'CONECTADO' : 'NO CONECTADO'
    });
});

// ==================== RUTAS DE CLASES PÚBLICAS ====================

// GET - Obtener todas las clases públicas
app.get('/api/clases-publicas', async (req, res) => {
    try {
        const db = await mongoDB.getDatabaseSafe('formulario');
        const clases = await db.collection('clases-publicas')
            .find({})
            .sort({ fechaClase: -1 })
            .toArray();
        
        res.json({ success: true, data: clases });
    } catch (error) {
        console.error('❌ Error obteniendo clases públicas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET - Obtener clases publicadas (para el index)
app.get('/api/clases-publicas/publicadas', async (req, res) => {
    try {
        console.log('📥 GET /api/clases-publicas/publicadas');
        const db = await mongoDB.getDatabaseSafe('formulario');
        const clases = await db.collection('clases-publicas')
            .find({ publicada: true })
            .sort({ fechaClase: -1 })
            .toArray();
        
        console.log(`✅ ${clases.length} clases publicadas encontradas`);
        
        res.json({ 
            success: true, 
            data: clases,
            serverTime: Date.now()
        });
    } catch (error) {
        console.error('❌ Error obteniendo clases publicadas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET - Obtener una clase pública por ID
app.get('/api/clases-publicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de clase inválido' 
            });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        const clase = await db.collection('clases-publicas').findOne({ 
            _id: new ObjectId(id) 
        });
        
        if (!clase) {
            return res.status(404).json({ 
                success: false, 
                message: 'Clase no encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            data: clase,
            serverTime: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo clase por ID:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor'
        });
    }
});

// POST - Crear nueva clase pública (CON ÁREA)
app.post('/api/clases-publicas', async (req, res) => {
    try {
        const userHeader = req.headers['user-id'];
        
        console.log('📦 ========== POST /api/clases-publicas ==========');
        console.log('📦 Body COMPLETO recibido:', JSON.stringify(req.body, null, 2));
        console.log('📦 Campo "area" en body:', req.body.area);
        console.log('📦 Tipo de area:', typeof req.body.area);
        
        if (!userHeader) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'advanced')) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para crear clases' 
            });
        }
        
        const { nombre, descripcion, fechaClase, instructores, lugar, enlaceFormulario, publicada, area } = req.body;
        
        if (!nombre || !fechaClase) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y fecha son obligatorios' 
            });
        }
        
        // Procesar fecha
        let fecha;
        if (fechaClase.includes('T')) {
            const [fechaPart, horaPart] = fechaClase.split('T');
            const [year, month, day] = fechaPart.split('-').map(Number);
            const [hour, minute] = horaPart.split(':').map(Number);
            const horaUTC = hour + 3;
            fecha = new Date(Date.UTC(year, month - 1, day, horaUTC, minute, 0));
        } else {
            const [year, month, day] = fechaClase.split('-').map(Number);
            fecha = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
        }
        
        // ✅ Asegurar que el área se guarda correctamente
        const areaFinal = area || 'todas';
        console.log('📌 Área a guardar en BD:', areaFinal);
        
        const nuevaClase = {
            nombre,
            descripcion: descripcion || '',
            fechaClase: fecha,
            instructores: instructores || [],
            lugar: lugar || '',
            enlaceFormulario: enlaceFormulario || '',
            publicada: publicada === true,
            area: areaFinal,
            fechaCreacion: new Date(),
            creadoPor: new ObjectId(userHeader)
        };
        
        const result = await db.collection('clases-publicas').insertOne(nuevaClase);
        
        console.log('✅ Clase creada con ID:', result.insertedId);
        console.log('📌 Área guardada:', areaFinal);
        
        res.json({ 
            success: true, 
            message: 'Clase pública creada exitosamente',
            data: { ...nuevaClase, _id: result.insertedId }
        });
        
    } catch (error) {
        console.error('❌ Error creando clase pública:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// PUT - Actualizar clase pública (CON ÁREA)
app.put('/api/clases-publicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userHeader = req.headers['user-id'];
        
        console.log('📦 ========== PUT /api/clases-publicas/:id ==========');
        console.log('📦 Body COMPLETO recibido:', JSON.stringify(req.body, null, 2));
        console.log('📦 Campo "area" en body:', req.body.area);
        
        if (!userHeader || !ObjectId.isValid(id)) {
            return res.status(401).json({ success: false, message: 'Solicitud inválida' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'advanced')) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para actualizar clases' 
            });
        }
        
        const { nombre, descripcion, fechaClase, instructores, lugar, enlaceFormulario, publicada, area } = req.body;
        
        if (!nombre || !fechaClase) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y fecha son obligatorios' 
            });
        }
        
        // Procesar fecha
        let fecha;
        if (fechaClase.includes('T')) {
            const [fechaPart, horaPart] = fechaClase.split('T');
            const [year, month, day] = fechaPart.split('-').map(Number);
            const [hour, minute] = horaPart.split(':').map(Number);
            const horaUTC = hour + 3;
            fecha = new Date(Date.UTC(year, month - 1, day, horaUTC, minute, 0));
        } else {
            const [year, month, day] = fechaClase.split('-').map(Number);
            fecha = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
        }
        
        // ✅ Asegurar que el área se actualiza correctamente
        const areaFinal = area || 'todas';
        console.log('📌 Área a actualizar en BD:', areaFinal);
        
        const updateData = {
            $set: {
                nombre,
                descripcion: descripcion || '',
                fechaClase: fecha,
                instructores: instructores || [],
                lugar: lugar || '',
                enlaceFormulario: enlaceFormulario || '',
                publicada: publicada === true,
                area: areaFinal,
                fechaActualizacion: new Date()
            }
        };
        
        const result = await db.collection('clases-publicas').updateOne(
            { _id: new ObjectId(id) },
            updateData
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        console.log('✅ Clase actualizada:', id);
        
        res.json({ success: true, message: 'Clase pública actualizada exitosamente' });
        
    } catch (error) {
        console.error('❌ Error actualizando clase pública:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// PUT - Cambiar visibilidad
app.put('/api/clases-publicas/:id/visibilidad', async (req, res) => {
    try {
        const { id } = req.params;
        const userHeader = req.headers['user-id'];
        const { publicada } = req.body;
        
        if (!userHeader || !ObjectId.isValid(id)) {
            return res.status(401).json({ success: false, message: 'Solicitud inválida' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'advanced')) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para cambiar visibilidad' 
            });
        }
        
        const result = await db.collection('clases-publicas').updateOne(
            { _id: new ObjectId(id) },
            { $set: { publicada: publicada === true } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        res.json({ 
            success: true, 
            message: publicada ? 'Clase publicada exitosamente' : 'Clase ocultada exitosamente' 
        });
        
    } catch (error) {
        console.error('❌ Error cambiando visibilidad:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar clase pública
app.delete('/api/clases-publicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userHeader = req.headers['user-id'];
        
        if (!userHeader || !ObjectId.isValid(id)) {
            return res.status(401).json({ success: false, message: 'Solicitud inválida' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'advanced')) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para eliminar clases' 
            });
        }
        
        const result = await db.collection('clases-publicas').deleteOne({
            _id: new ObjectId(id)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        res.json({ success: true, message: 'Clase pública eliminada exitosamente' });
        
    } catch (error) {
        console.error('❌ Error eliminando clase pública:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ==================== RUTAS DE CLASES HISTÓRICAS ====================

app.get('/api/clases-historicas', async (req, res) => {
    try {
        const db = await mongoDB.getDatabaseSafe('formulario');
        const clases = await db.collection('clases')
            .find({})
            .sort({ fechaClase: -1 })
            .toArray();
        
        res.json({ success: true, data: clases });
    } catch (error) {
        console.error('❌ Error obteniendo clases:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.get('/api/clases-historicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        const clase = await db.collection('clases').findOne({ 
            _id: new ObjectId(id) 
        });
        
        if (!clase) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        res.json({ success: true, data: clase, serverTime: Date.now() });
        
    } catch (error) {
        console.error('❌ Error obteniendo clase:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.post('/api/clases-historicas', async (req, res) => {
    try {
        const userHeader = req.headers['user-id'];
        
        console.log('📦 ========== POST /api/clases-historicas ==========');
        console.log('📦 Body COMPLETO recibido:', JSON.stringify(req.body, null, 2));
        console.log('📦 Campo "area" en body:', req.body.area);
        
        if (!userHeader) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || usuario.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo administradores pueden crear clases' 
            });
        }
        
        const { nombre, descripcion, fechaClase, enlaces, instructores, tags, estado, area } = req.body;
        
        if (!nombre || !fechaClase) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos: nombre y fecha son obligatorios' 
            });
        }
        
        // Procesar fecha
        let fecha;
        if (fechaClase.includes('T')) {
            const [fechaPart, horaPart] = fechaClase.split('T');
            const [year, month, day] = fechaPart.split('-').map(Number);
            const [hour, minute] = horaPart.split(':').map(Number);
            const horaUTC = hour + 3;
            fecha = new Date(Date.UTC(year, month - 1, day, horaUTC, minute, 0));
        } else {
            const [year, month, day] = fechaClase.split('-').map(Number);
            fecha = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
        }
        
        let estadoFinal = estado || 'activa';
        const activaBool = estadoFinal === 'activa' || estadoFinal === 'publicada';
        
        // ✅ Asegurar que el área se guarda
        const areaFinal = area || 'todas';
        console.log('📌 Área a guardar en BD (histórica):', areaFinal);
        
        const nuevaClase = {
            nombre,
            descripcion: descripcion || '',
            fechaClase: fecha,
            enlaces: enlaces || { youtube: '', powerpoint: '' },
            activa: activaBool,
            estado: estadoFinal,
            instructores: instructores || [],
            tags: tags || [],
            area: areaFinal,
            fechaCreacion: new Date(),
            creadoPor: new ObjectId(userHeader)
        };
        
        const result = await db.collection('clases').insertOne(nuevaClase);
        
        console.log('✅ Clase creada:', result.insertedId);
        console.log('📌 Área guardada:', areaFinal);
        
        res.json({ 
            success: true, 
            message: 'Clase creada exitosamente',
            data: { ...nuevaClase, _id: result.insertedId }
        });
        
    } catch (error) {
        console.error('❌ Error creando clase:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.put('/api/clases-historicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userHeader = req.headers['user-id'];
        
        if (!userHeader || !ObjectId.isValid(id)) {
            return res.status(401).json({ success: false, message: 'Solicitud inválida' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || usuario.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo administradores pueden actualizar clases' 
            });
        }
        
        const { nombre, descripcion, fechaClase, enlaces, instructores, tags, estado, area } = req.body;
        
        if (!nombre || !fechaClase) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos: nombre y fecha son obligatorios' 
            });
        }
        
        // Procesar fecha
        let fecha;
        if (fechaClase.includes('T')) {
            const [fechaPart, horaPart] = fechaClase.split('T');
            const [year, month, day] = fechaPart.split('-').map(Number);
            const [hour, minute] = horaPart.split(':').map(Number);
            const horaUTC = hour + 3;
            fecha = new Date(Date.UTC(year, month - 1, day, horaUTC, minute, 0));
        } else {
            const [year, month, day] = fechaClase.split('-').map(Number);
            fecha = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
        }
        
        let estadoFinal = estado || 'activa';
        const activaBool = estadoFinal === 'activa' || estadoFinal === 'publicada';
        
        // ✅ Asegurar que el área se actualiza
        const areaFinal = area || 'todas';
        console.log('📌 Área a actualizar en BD (histórica):', areaFinal);
        
        const updateData = {
            $set: {
                nombre,
                descripcion: descripcion || '',
                fechaClase: fecha,
                enlaces: enlaces || { youtube: '', powerpoint: '' },
                activa: activaBool,
                estado: estadoFinal,
                instructores: instructores || [],
                tags: tags || [],
                area: areaFinal,
                fechaActualizacion: new Date()
            }
        };
        
        const result = await db.collection('clases').updateOne(
            { _id: new ObjectId(id) },
            updateData
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        console.log('✅ Clase actualizada:', id);
        
        res.json({ success: true, message: 'Clase actualizada exitosamente' });
        
    } catch (error) {
        console.error('❌ Error actualizando clase:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.delete('/api/clases-historicas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userHeader = req.headers['user-id'];
        
        if (!userHeader || !ObjectId.isValid(id)) {
            return res.status(401).json({ success: false, message: 'Solicitud inválida' });
        }
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({ 
            _id: new ObjectId(userHeader) 
        });
        
        if (!usuario || usuario.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo administradores pueden eliminar clases' 
            });
        }
        
        const result = await db.collection('clases').deleteOne({
            _id: new ObjectId(id)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Clase no encontrada' });
        }
        
        console.log('✅ Clase eliminada:', id);
        
        res.json({ success: true, message: 'Clase eliminada exitosamente' });
        
    } catch (error) {
        console.error('❌ Error eliminando clase:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ==================== RUTAS DE AUTENTICACIÓN (simplificadas) ====================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        const usuario = await db.collection('usuarios').findOne({
            $or: [
                { email: identifier },
                { legajo: identifier.toString() }
            ]
        });

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        const passwordMatches = verifyPassword(password, usuario.password);
        
        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const { password: _, ...usuarioSinPassword } = usuario;
        
        res.json({ 
            success: true, 
            message: 'Login exitoso', 
            data: usuarioSinPassword
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ==================== RUTA PARA ACTUALIZAR CLASES EXISTENTES ====================

app.post('/api/migrate/areas', async (req, res) => {
    try {
        const db = await mongoDB.getDatabaseSafe('formulario');
        
        // Actualizar clases públicas sin área
        const resultPublicas = await db.collection('clases-publicas').updateMany(
            { area: { $exists: false } },
            { $set: { area: 'todas' } }
        );
        
        // Actualizar clases históricas sin área
        const resultHistoricas = await db.collection('clases').updateMany(
            { area: { $exists: false } },
            { $set: { area: 'todas' } }
        );
        
        console.log('✅ Migración completada:');
        console.log(`   - Clases públicas: ${resultPublicas.modifiedCount} actualizadas`);
        console.log(`   - Clases históricas: ${resultHistoricas.modifiedCount} actualizadas`);
        
        res.json({ 
            success: true, 
            message: 'Migración completada',
            clasesPublicas: resultPublicas.modifiedCount,
            clasesHistoricas: resultHistoricas.modifiedCount
        });
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== EXPORTAR ====================
module.exports = app;