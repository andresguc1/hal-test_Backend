import Joi from 'joi';

/**
 * Middleware genérico para validar el cuerpo (body), los parámetros (params)
 * y/o los queries de una solicitud contra un esquema Joi.
 * * @param {object} schemas - Un objeto que contiene los esquemas Joi para 'body', 'params' y/o 'query'.
 * @returns {function} Un middleware de Express.
 */
const validate = (schemas) => (req, res, next) => {
    // 1. Construir el esquema maestro y el objeto de datos dinámicamente.
    const masterSchemaObject = {};
    const validationData = {};

    for (const key of ['body', 'params', 'query']) {
        if (schemas[key]) {
            // Solo incluimos la clave si se proporcionó un esquema
            masterSchemaObject[key] = schemas[key];

            // Recolectamos los datos de la solicitud (usando objeto vacío si no existe, p. ej., body vacío)
            validationData[key] = req[key] || {};
        }
    }

    // Si no se pasó ningún esquema, no hay nada que validar
    if (Object.keys(masterSchemaObject).length === 0) {
        return next();
    }

    // 2. Definir el esquema maestro (ahora solo contiene esquemas válidos)
    const masterSchema = Joi.object(masterSchemaObject);

    // 3. Opciones de validación
    const options = {
        abortEarly: false,
        stripUnknown: true, // Limpia el output de campos no definidos
    };

    // 4. Ejecutar la validación
    const { error, value } = masterSchema.validate(validationData, options);

    if (error) {
        // 5. Crear el objeto de detalles de error
        const errorDetails = error.details.map((detail) => ({
            // El .path[1] es el campo real (ej: 'url').
            field: detail.path[1] || detail.context.key,
            // Limpia comillas del mensaje
            message: detail.message.replace(/['"]/g, ''),
        }));

        // 🚨 CORRECCIÓN CRÍTICA: Volver a pasar el error a 'next(error)'.
        // Esto soluciona el `TypeError: res.status is not a function` en los unit tests.
        // La responsabilidad de enviar el 400 recae ahora en un middleware de manejo de errores global.
        const validationError = new Error('Error de validación de datos en la solicitud.');
        validationError.statusCode = 400; // Asignamos el status code esperado
        validationError.details = errorDetails;

        return next(validationError);
    }

    // 6. Si la validación es exitosa, reemplazar los datos de la solicitud con los datos limpios.
    // Solo se reemplazarán las propiedades que existen en 'value' (y por ende en 'schemas').
    if (value.body) {
        req.body = value.body;
    }
    if (value.params) {
        req.params = value.params;
    }
    if (value.query) {
        req.query = value.query;
    }

    next();
};

export default validate;
