// routes/mock.router.js
/**
 * Rutas de la API que devuelven datos de configuración (Mocks)
 * como categorías, esquemas de nodos y datos de proyectos simulados.
 */

import { Router } from 'express';
import validate from '../middlewares/validator.js';
import openUrlBodySchema from '../schemas/open_url/body.js';
import { mockCategories, allNodeFieldConfigs, mockProjectData } from '../config/mockData.js';

const router = Router();

// 1. API: Obtener la estructura de categorías y nodos
router.get('/nodes/categories', (req, res) => {
    console.log('📂 API: Devolviendo categorías de nodos MCP.');
    res.json(mockCategories);
});

// 2. API: Obtener el esquema (parámetros) para una o todas las operaciones
router.get('/nodes/operations', (req, res) => {
    const operationName = req.query.op;

    if (operationName) {
        console.log(`📋 API: Devolviendo esquema para la operación: ${operationName}`);
        const schema = allNodeFieldConfigs[operationName];

        if (schema) {
            return res.json({ [operationName]: schema });
        } else {
            return res.status(404).json({
                error: `Operación '${operationName}' no encontrada.`,
            });
        }
    }

    console.log('📋 API: Devolviendo todos los esquemas de operaciones.');
    res.json(allNodeFieldConfigs);
});

// 3. API: Cargar datos de un proyecto (Mock)
router.get('/project/load', (req, res) => {
    const projectId = req.query.id;

    if (projectId === mockProjectData.projectId) {
        console.log(`📦 API: Devolviendo datos de proyecto: ${projectId}`);
        return res.json(mockProjectData);
    }

    console.log(`❌ API: Proyecto ID ${projectId} no encontrado.`);
    res.status(404).json({ error: 'Proyecto no encontrado' });
});

// 4. API: Simulación de recepción de flujo para Guardar/Ejecutar
router.post('/data', (req, res) => {
    const receivedData = req.body;
    console.log(
        `📥 API: Recibida solicitud POST en /api/data. Tamaño: ${JSON.stringify(receivedData).length} bytes`,
    );

    if (!receivedData || Object.keys(receivedData).length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'No se recibieron datos en el cuerpo de la solicitud.',
            data: receivedData,
        });
    }

    res.json({
        status: 'success',
        message: 'Flujo de trabajo o datos recibidos y procesados correctamente (Mock).',
        received_timestamp: new Date().toISOString(),
        data_keys_received: Object.keys(receivedData),
    });
});

// 5. API: Ruta de prueba para el middleware de validación (open_url)
router.post(
    '/actions/open_url_test', // Le cambiamos el nombre para que no choque con la ruta real en api.router.js
    validate({ body: openUrlBodySchema }),
    (req, res) => {
        const { url, timeout } = req.body;

        console.log(`✅ Ejecutando Open URL Test en: ${url} con timeout: ${timeout}ms`);

        res.status(200).json({
            success: true,
            message: 'Validación de esquema de Open URL exitosa.',
            data: req.body,
        });
    },
);

export default router;
