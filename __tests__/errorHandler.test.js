// __tests__/errorHandler.test.js

import request from 'supertest';
import express from 'express';
// ⬇️ Importar el middleware a probar
import errorHandler from '../middlewares/errorHandler.js';

// -------------------------------------------------------------
// Función Auxiliar para crear una app aislada
// -------------------------------------------------------------
const createTestApp = (errorToThrow) => {
    const app = express();

    // Necesario para que la app sepa parsear JSON
    app.use(express.json());

    // 1. Ruta que lanza el error que queremos probar
    app.get('/error-test', (req, res, next) => {
        // Lanza el error usando next(error)
        return next(errorToThrow);
    });

    // 2. Middleware de Fallback 404 (para asegurar que los errores son capturados antes)
    app.use((req, res) => {
        res.status(404).send('Not Found');
    });

    // 3. Manejador de Errores (DEBE IR ÚLTIMO)
    app.use(errorHandler);

    return app;
};

// -------------------------------------------------------------
// PRUEBAS
// -------------------------------------------------------------

describe('ErrorHandler Middleware', () => {
    // Simular un error de Servidor Interno (500)
    it('debe capturar errores sin statusCode y devolver 500 generico', async () => {
        const genericError = new Error('Database connection failed.');

        // Simular modo producción para verificar el mensaje genérico
        process.env.NODE_ENV = 'production';
        const app = createTestApp(genericError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        // Debe devolver el mensaje genérico en producción
        expect(response.body.error).toBe(
            'Error interno del servidor. Intente nuevamente más tarde.',
        );
        // No debe incluir el stack trace en producción
        expect(response.body.stack).toBeUndefined();

        // Volver a modo desarrollo para otras pruebas
        process.env.NODE_ENV = 'development';
    });

    // Simular un error personalizado (ej: 401 Unauthorized o 404 de servicio interno)
    it('debe capturar errores con statusCode adjunto (401)', async () => {
        const authError = new Error('Access denied. Invalid token.');
        authError.statusCode = 401; // Error personalizado

        const app = createTestApp(authError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access denied. Invalid token.');
        expect(response.body.status).toBe(401);
    });

    // Simular un error de Validación (400) que incluye la propiedad 'details'
    it('debe capturar errores de validacion (400) y devolver los detalles', async () => {
        const validationError = new Error('Error de validación de datos en la solicitud.');
        validationError.statusCode = 400;
        validationError.details = [{ field: 'url', message: 'La URL es obligatoria.' }]; // Detalle del validator.js

        const app = createTestApp(validationError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Error de validación de datos en la solicitud.');
        expect(response.body.details).toBeDefined();
        expect(response.body.details[0].field).toBe('url');
    });
});
