// middlewares/errorHandler.js

/**
 * Middleware para el Manejo de Errores Centralizado (Custom Error Handler).
 * Captura errores lanzados por rutas o middlewares y envía una respuesta JSON
 * estandarizada.
 *
 * @param {Error} err - El objeto de error lanzado.
 * @param {import('express').Request} req - Objeto de solicitud.
 * @param {import('express').Response} res - Objeto de respuesta.
 * @param {import('express').NextFunction} _next - Función para pasar el control.
 * (DEBE ESTAR PRESENTE PARA RECONOCIMIENTO)
 */
const errorHandler = (err, req, res) => {
    // 🔑 CORRECCIÓN: Agregar 'next'
    // 1. Determinar el código de estado.
    const statusCode = err.statusCode || 500;

    // 2. Determinar el mensaje de error.
    const message =
        statusCode === 500 && process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor. Intente nuevamente más tarde.'
            : err.message || 'Error desconocido del servidor.';

    // 3. Loggear el error completo en el servidor (no al cliente).
    console.error(`[ERROR ${statusCode}]: ${message}`);

    // Opcional: Loggear el stack trace solo en desarrollo para debugging.
    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
        console.error(err.stack);
    }

    // 4. Enviar la respuesta estandarizada en formato JSON.
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        error: message,

        // Incluir detalles de validación si existen (ej: desde el validator.js)
        details: err.details || undefined,

        // Opcional: incluir el stack trace solo en desarrollo
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });

    // NOTA: No se llama a next() aquí porque este es el final del manejo de errores
    // y Express no necesita continuar el procesamiento.
};

export default errorHandler;
