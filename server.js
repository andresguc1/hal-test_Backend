// server.js

import express from 'express';
import cors from 'cors';
import actionRouter from './routes/actionRoutes.js'; // Asumimos que aquí montarás las acciones
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './middlewares/logger.js';

// --- Configuración Inicial ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Globales ---
// 1. CORS: Permite peticiones desde otros dominios
app.use(cors());

// 2. Body Parser: Convierte el cuerpo de las peticiones a JSON
app.use(express.json());

// 3. Logger: Registra las peticiones entrantes
app.use(logger);

// --- Rutas ---
// Ruta de salud/prueba
app.get('/', (req, res) => {
    res.status(200).send('Playwright Automation API is running.');
});

// Monta el router principal para las acciones (por ejemplo, /api/v1/action)
app.use('/api/v1/action', actionRouter);

// --- Manejador de Errores ---
// Este debe ser el último middleware
app.use(errorHandler);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access at http://localhost:${PORT}`);
});
