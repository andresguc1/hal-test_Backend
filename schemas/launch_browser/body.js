// schemas/launch_browser/body.js

import Joi from 'joi';

// Array de valores permitidos para browserType
const allowedBrowserTypes = ['chromium', 'firefox', 'webkit'];

const launchBrowserBodySchema = Joi.object({
    // 1. browserType
    browserType: Joi.string()
        .valid(...allowedBrowserTypes)
        .default('chromium') // Coincide con el defaultValue del frontend
        .required() // Coincide con el required: true del frontend
        .messages({
            'any.required': 'El tipo de navegador (browserType) es obligatorio.',
            'any.only': 'El tipo de navegador debe ser chromium, firefox, o webkit.',
        }),

    // 2. headless (Asumido como el siguiente campo lógico)
    // Indica si el navegador debe ejecutarse en modo headless (sin interfaz visual)
    headless: Joi.boolean()
        .default(true) // Por defecto, Playwright usa true
        .optional()
        .messages({
            'boolean.base': 'El campo headless debe ser un valor booleano (true/false).',
        }),

    // 3. Otros parámetros de lanzamiento (opcional)
    // Por ejemplo, puedes definir un objeto para 'args' o 'channel' si los necesitas.

    // Bloquea cualquier campo extra que no esté definido.
}).unknown(false);

export default launchBrowserBodySchema;
