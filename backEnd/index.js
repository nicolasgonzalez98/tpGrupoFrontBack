const express = require('express');
const cors = require('cors')
const app = express();
const port = 3000;
const connectDB = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const cervezaRoutes = require('./routes/cervezaRoutes');

app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRoutes);
app.use('/cervezas', cervezaRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
