// schemas/resize_viewport/body.js

import Joi from 'joi';

// NOTA: La lista de dispositivos debe coincidir con lo que Playwright soporta.
const exampleDevices = [
    'iPhone 13',
    'Pixel 5',
    'iPad Pro',
    'Desktop Chrome',
    '', // Opción de tamaño manual
];

const resizeViewportBodySchema = Joi.object({
    // 1. deviceEmulation (String, Opcional)
    deviceEmulation: Joi.string()
        .valid(...exampleDevices)
        .default('') // Por defecto, tamaño manual
        .optional()
        .messages({
            'any.only': 'El dispositivo seleccionado no es una emulación válida.',
        }),

    // 2. width (Número, Requerido CONDICIONAL)
    width: Joi.number()
        .integer()
        .min(1)
        .when('deviceEmulation', {
            // Solo requerido si deviceEmulation NO está presente o es vacío
            is: Joi.valid('', null),
            then: Joi.required(),
            otherwise: Joi.optional(), // Si se selecciona un dispositivo, width se ignora o es opcional
        })
        .messages({
            'any.required': 'El ancho es obligatorio si no se selecciona emulación de dispositivo.',
            'number.min': 'El ancho debe ser un valor positivo.',
        }),

    // 3. height (Número, Requerido CONDICIONAL)
    height: Joi.number()
        .integer()
        .min(1)
        .when('deviceEmulation', {
            // Solo requerido si deviceEmulation NO está presente o es vacío
            is: Joi.valid('', null),
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El alto es obligatorio si no se selecciona emulación de dispositivo.',
            'number.min': 'El alto debe ser un valor positivo.',
        }),
}).unknown(false);

export default resizeViewportBodySchema;
