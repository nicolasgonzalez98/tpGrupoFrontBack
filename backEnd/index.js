require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const cervezaRoutes = require('./routes/cervezaRoutes');
const stockRoutes = require('./routes/stockRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const usuarioRouter = require('./routes/adminUsuarioRoutes'); 

// CORS restringido a orígenes locales (antes estaba totalmente abierto).
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/] }));
app.use(express.json());
connectDB();


app.use('/api/auth', authRoutes);

app.use('/api/usuarios', usuarioRouter);

app.use('/stock', stockRoutes);

app.use('/pedido', pedidoRoutes);

app.use('/', cervezaRoutes);


app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
