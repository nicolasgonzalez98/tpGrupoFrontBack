const express = require('express');
const cors = require('cors')
const app = express();
const port = 3000;
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');

const usuarioRouter = require('./routers/UsuarioRouter'); 

app.use(cors());
app.use(express.json());
connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRouter);

// Ruta de ejemplo
app.get('/', (req, res) => {
  res.send('¡Hola desde el backend con Express!');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
