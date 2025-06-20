require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT;
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const cervezaRoutes = require('./routes/cervezaRoutes');
const stockRoutes = require('./routes/stockRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');


app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRoutes);

app.use('/', cervezaRoutes);

app.use('/stock', stockRoutes);

app.use('/pedido', pedidoRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
