const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Ruta a los archivos estáticos generados por Angular
const DIST_PATH = path.join(__dirname, 'dist', 'pharmacy-app', 'browser');

// Servir archivos estáticos
app.use(express.static(DIST_PATH));

// Para cualquier ruta que no sea un archivo estático, devolver index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
