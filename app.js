// app.js
// ==========================
// 🚀 HaltTest Backend Server (Orquestador Principal)
// ==========================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Módulos de Express y Middlewares
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import { developmentLogger, productionLogger } from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';

// Módulos de Rutas
import apiRouter from './routes/api.router.js'; // Rutas de Acciones (Conectadas al MCP)
import mockRouter from './routes/mock.router.js'; // Rutas de Mocks y Configuración (Nodos, Esquemas)

// 🆕 Módulo de Conexión MCP
import { connectMCP } from './services/mcp.service.js';

const app = express();
const PORT = process.env.PORT || 2001;

// --- 1. MIDDLEWARES DE SEGURIDAD ---
app.use(helmetMiddleware);
app.use(apiLimiter);

// --- 2. MIDDLEWARES DE FORMATO ---
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. LOGGERS ---
if (process.env.NODE_ENV === 'production') {
    app.use(productionLogger());
} else {
    app.use(developmentLogger());
}

// --- 4. MONTAJE DE RUTAS ---

// Montar el router de acciones reales del MCP (launch_browser, open_url, etc.)
app.use('/api', apiRouter);

// Montar el router de Mocks y configuración de nodos
app.use('/api', mockRouter);

// Ruta de estatus/salud general (Heath Check)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'HaltTest API is up and running 🚀',
        version: '1.0.0-MCP',
        timestamp: new Date().toISOString(),
    });
});

// --- 5. MANEJO DE ERRORES ---

// Manejo de Rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Ruta no encontrada: ${req.method} ${req.path}`,
    });
});

// Manejador de Errores Centralizado (500, Validación, etc.)
app.use(errorHandler);

// --- 6. INICIO DEL SERVIDOR ---
app.listen(PORT, async () => {
    // ⚠️ app.listen ahora es ASÍNCRONO
    console.log(`\n🚀 ================================`);
    console.log(`   HaltTest Backend Server`);
    console.log(`   Corriendo en: http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // 🌐 CONEXIÓN CRÍTICA AL PLAYWRIGHT MCP
    try {
        await connectMCP();
        console.log(`✅ Conexión con Playwright MCP establecida.`);
    } catch (error) {
        console.error(`❌ ERROR: No se pudo conectar con Playwright MCP.`);
        console.error(`   Asegúrate de que el MCP esté corriendo en el puerto configurado.`);
        console.error(`   Detalle: ${error.message}`); // 🆕 Usamos 'error' aquí
    }

    console.log(`================================\n`);
});

export default app;
