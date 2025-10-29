// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        // Usa el entorno de Node.js
        environment: 'node',
        // Permite que las importaciones de Node.js funcionen sin problemas
        deps: {
            inline: ['supertest'], // Asegura que supertest funcione en Vitest
        },
    },
});
