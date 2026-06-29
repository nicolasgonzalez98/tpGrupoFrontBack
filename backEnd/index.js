require('dotenv').config();
const express = require('express');
const cors = require('cors')
const helmet = require('helmet');
const app = express();
const port = process.env.PORT || 3000;
// Persistencia en DynamoDB (AWS SDK v3). No requiere "conectar": el cliente
// usa el rol de la EC2 y la región del entorno. Ver database/dynamoClient.js.
const authRoutes = require('./routes/authRoutes');
const cervezaRoutes = require('./routes/cervezaRoutes');
const stockRoutes = require('./routes/stockRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const usuarioRouter = require('./routes/adminUsuarioRoutes'); 

// Cabeceras de seguridad (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
app.use(helmet());
// CORS restringido: orígenes locales (dev) + cualquier front desplegado en Amplify
// (el dominio de Amplify cambia con cada app/deploy, por eso usamos un patrón).
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^https:\/\/[a-z0-9.-]+\.amplifyapp\.com$/] }));
// Límite de tamaño del body para evitar payloads abusivos.
app.use(express.json({ limit: '100kb' }));


app.use('/api/auth', authRoutes);

app.use('/api/usuarios', usuarioRouter);

app.use('/stock', stockRoutes);

app.use('/pedido', pedidoRoutes);

app.use('/', cervezaRoutes);


// Manejo centralizado de errores. Debe ir DESPUÉS de las rutas y tener 4 argumentos.
// - JSON malformado (body-parser) → 400 limpio, sin volcar el stack trace al cliente.
// - Cualquier otro error no controlado → 500 genérico. El detalle queda solo en el log.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ message: 'JSON inválido en el cuerpo de la petición' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'El cuerpo de la petición es demasiado grande' });
  }
  console.error('Error no controlado:', err);
  res.status(err.status || 500).json({ message: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
