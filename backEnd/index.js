const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./database/connection');

// Middleware para parsear JSON
app.use(express.json());
connectDB();


// Ruta de ejemplo
app.get('/', (req, res) => {
  res.send('¡Hola desde el backend con Express!');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
