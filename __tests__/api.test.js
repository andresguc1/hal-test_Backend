// __tests__/api.test.js

const request = require('supertest');
// Importamos la instancia de tu aplicación Express
const app = require('../app');

// Bloque principal de pruebas
describe('HalTest MCP API Tests', () => {
    // Prueba #1: GET /api/status - Verifica el estado del servidor
    test('1. GET /api/status debe devolver 200 con status: ok', async () => {
        const response = await request(app)
            .get('/api/status')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.status).toBe('ok');
        expect(response.body.message).toContain('up and running');
    });

    // Prueba #2: GET /api/nodes/categories - Obtiene la estructura del catálogo
    test('2. GET /api/nodes/categories debe devolver 11 categorías', async () => {
        const response = await request(app)
            .get('/api/nodes/categories')
            .expect('Content-Type', /json/)
            .expect(200);

        // Verifica que se devuelvan exactamente 11 categorías
        expect(Object.keys(response.body)).toHaveLength(11);
        // Verifica la estructura de una categoría clave
        expect(response.body).toHaveProperty('browser_management');
        expect(response.body.browser_management.nodes).toContain('launch_browser');
    });

    // Prueba #3: GET /api/nodes/operations - Obtiene TODOS los esquemas
    test('3. GET /api/nodes/operations (sin param) debe devolver todos los esquemas (al menos 15)', async () => {
        const response = await request(app)
            .get('/api/nodes/operations')
            .expect('Content-Type', /json/)
            .expect(200);

        // Verifica que se devuelvan múltiples esquemas (basado en tu app.js, son más de 15)
        expect(Object.keys(response.body).length).toBeGreaterThan(15);
        // Verifica que el esquema 'open_url' esté presente
        expect(response.body).toHaveProperty('open_url');
        expect(response.body.open_url).toBeInstanceOf(Array);
    });

    // Prueba #4: GET /api/nodes/operations?op=click - Esquema específico
    test('4. GET con op=click debe devolver el esquema de click y el selector es requerido', async () => {
        const response = await request(app)
            .get('/api/nodes/operations')
            .query({ op: 'click' }) // Parámetro de query op=click
            .expect('Content-Type', /json/)
            .expect(200);

        // Verifica que SOLO contenga la clave 'click'
        expect(Object.keys(response.body)).toEqual(['click']);
        // Verifica que el campo selector sea requerido
        const selectorField = response.body.click.find((f) => f.name === 'selector');
        expect(selectorField.required).toBe(true);
    });

    // Prueba #5: GET /api/nodes/operations?op=resize_viewport - Esquema específico (ejemplo de Navegador)
    test('5. GET con op=resize_viewport debe devolver el esquema de viewport con width/height', async () => {
        const response = await request(app)
            .get('/api/nodes/operations')
            .query({ op: 'resize_viewport' })
            .expect('Content-Type', /json/)
            .expect(200);

        // Verifica que SOLO contenga la clave 'resize_viewport'
        expect(Object.keys(response.body)).toEqual(['resize_viewport']);
        // Verifica que tenga el campo 'width'
        expect(response.body.resize_viewport.some((f) => f.name === 'width')).toBe(true);
    });

    // Prueba #7: GET /api/nodes/operations?op=operacion-no-existe - Petición inválida (404)
    test('7. GET con op=no-existe debe devolver 404 Not Found', async () => {
        const response = await request(app)
            .get('/api/nodes/operations')
            .query({ op: 'operacion-no-existe' })
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toHaveProperty(
            'error',
            "Operación 'operacion-no-existe' no encontrada.",
        );
    });

    // Prueba #8: GET /api/project/load?id=PRJ-42 - Carga de Mock de Proyecto exitosa
    test('8. GET /api/project/load?id=PRJ-42 debe devolver el mock del proyecto', async () => {
        const response = await request(app)
            .get('/api/project/load')
            .query({ id: 'PRJ-42' })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('projectId', 'PRJ-42');
        expect(response.body.nodes).toBeInstanceOf(Array);
        expect(response.body.nodes).toHaveLength(4); // Basado en el mock de tu app.js
    });

    // Prueba #9: GET /api/project/load?id=ID-INCORRECTO - Carga de Mock de Proyecto (404)
    test('9. GET /api/project/load?id=ID-INCORRECTO debe devolver 404', async () => {
        const response = await request(app)
            .get('/api/project/load')
            .query({ id: 'ID-INCORRECTO' })
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toHaveProperty('error', 'Proyecto no encontrado');
    });

    // Prueba #10: POST /api/data - Envío de flujo (Simulación de Guardado/Ejecución)
    test('10. POST /api/data con payload debe devolver status success', async () => {
        const testPayload = {
            flowId: 'temp-001',
            nodes: [{ id: 'n1', type: 'type_text', data: { selector: '#user', text: 'test' } }],
            edges: [{ source: 'start', target: 'n1' }],
        };

        const response = await request(app)
            .post('/api/data')
            .send(testPayload) // Envía el cuerpo JSON
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.status).toBe('success');
        expect(response.body.message).toContain('recibidos y procesados correctamente');
        expect(response.body.data_keys_received).toEqual(
            expect.arrayContaining(['flowId', 'nodes', 'edges']),
        );
    });
});
