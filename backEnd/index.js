const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT;
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const stockRoutes = require('./routes/stockRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRoutes);

app.use('/', homeRoutes);

app.use('/stock', stockRoutes);

app.use('/pedido', pedidoRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
