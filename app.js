// app.js
// ==========================
// 🚀 HaltTest Backend Server
// ==========================

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Mensaje inicial
app.get('/', (req, res) => {
    res.send(`
        <h1>Hal-Test Backend</h1>
        <p>🧠 HaltTest backend is running successfully.</p>
        <p>Port: ${PORT}</p>
    `);
});

// Servidor en marcha
app.listen(PORT, () => {
    console.log(`✅ HaltTest server is running at: http://localhost:${PORT}`);
});
