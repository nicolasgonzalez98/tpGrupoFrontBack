require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/Usuario');
const { uri_db } = require('./config');


mongoose.connect(uri_db)
  .then(async () => {
    console.log('Conectado a MongoDB');

    const user = new User({
      nombre: 'Nico',
      email: 'nico@example.com',
      password: '123456',
      rol: 'admin'
    });

    await user.save();
    console.log('Usuario creado:', user);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error al conectar o crear el usuario:', err);
    mongoose.disconnect();
  });

