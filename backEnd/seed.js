// Datos de ejemplo para DynamoDB: usuarios (3 roles), cervezas y pedidos.
// Hashea las contraseñas con bcrypt (igual que el registro real), así podés loguearte.
// Es idempotente: saltea usuarios/cervezas que ya existen, y no recrea pedidos si ya hay.
//
// Uso (en la EC2, dentro de backEnd):   node seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const userRepo = require('./repository/userRepository');
const cervezaRepo = require('./repository/cervezaRepository');
const pedidoRepo = require('./repository/pedidoRepository');

const PASSWORD = 'Password123!'; // misma para todos los usuarios de prueba

const USUARIOS = [
  { nombre: 'Ana Admin',     email: 'admin@cervezas.com',     rol: 'admin' },
  { nombre: 'Emi Empleado',  email: 'empleado@cervezas.com',  rol: 'empleado' },
  { nombre: 'Beto Barra',    email: 'empleado2@cervezas.com', rol: 'empleado' },
  { nombre: 'Caro Cliente',  email: 'cliente@cervezas.com',   rol: 'cliente' },
  { nombre: 'Diego Díaz',    email: 'cliente2@cervezas.com',  rol: 'cliente' },
  { nombre: 'Lucía López',   email: 'cliente3@cervezas.com',  rol: 'cliente' },
];

const CERVEZAS = [
  { nombre: 'Patagonia Amber Lager', tipo: 'Amber Lager',        stock_actual: 50,  stock_minimo: 10 },
  { nombre: 'Andes IPA',             tipo: 'IPA',                stock_actual: 30,  stock_minimo: 8 },
  { nombre: 'Imperial Stout',        tipo: 'Stout',              stock_actual: 20,  stock_minimo: 5 },
  { nombre: 'Quilmes Pilsen',        tipo: 'Pilsner',            stock_actual: 100, stock_minimo: 20 },
  { nombre: 'Trigo Dorado',          tipo: 'Hefeweizen',         stock_actual: 25,  stock_minimo: 6 },
  { nombre: 'Roja Escocesa',         tipo: 'Scotch Ale',         stock_actual: 12,  stock_minimo: 4 },
  { nombre: 'Golden Session',        tipo: 'Golden Ale',         stock_actual: 40,  stock_minimo: 10 },
  { nombre: 'Porter de la Casa',     tipo: 'Porter',             stock_actual: 18,  stock_minimo: 5 },
  { nombre: 'Negra Irlandesa',       tipo: 'Dry Stout',          stock_actual: 8,   stock_minimo: 10 }, // bajo mínimo
  { nombre: 'Belgian Tripel',        tipo: 'Tripel',             stock_actual: 15,  stock_minimo: 5 },
  { nombre: 'Witbier Cítrica',       tipo: 'Witbier',            stock_actual: 35,  stock_minimo: 8 },
  { nombre: 'Barleywine Añejada',    tipo: 'Barleywine',         stock_actual: 6,   stock_minimo: 3 },
  { nombre: 'Märzen de Octubre',     tipo: 'Märzen',             stock_actual: 22,  stock_minimo: 6 },
  { nombre: 'APA Sesionable',        tipo: 'American Pale Ale',  stock_actual: 45,  stock_minimo: 10 },
  { nombre: 'Doble IPA Lupulada',    tipo: 'Double IPA',         stock_actual: 0,   stock_minimo: 5 },  // agotada
  { nombre: 'Brown Ale Nogal',       tipo: 'Brown Ale',          stock_actual: 14,  stock_minimo: 5 },
  { nombre: 'Saison de Verano',      tipo: 'Saison',             stock_actual: 28,  stock_minimo: 7 },
  { nombre: 'Bock Fuerte',           tipo: 'Bock',               stock_actual: 9,   stock_minimo: 10 }, // bajo mínimo
];

// Pedidos por nombre (se resuelven a _id luego de crear las cervezas).
const PEDIDOS = [
  { cliente: 'cliente@cervezas.com',  estado: 'pendiente', items: [['Andes IPA', 2], ['Quilmes Pilsen', 6]] },
  { cliente: 'cliente@cervezas.com',  estado: 'aprobado',  aprobadoPor: 'admin@cervezas.com', items: [['Imperial Stout', 3]] },
  { cliente: 'cliente2@cervezas.com', estado: 'pendiente', items: [['Golden Session', 4], ['Porter de la Casa', 2]] },
  { cliente: 'cliente2@cervezas.com', estado: 'rechazado', items: [['Barleywine Añejada', 5]] },
  { cliente: 'cliente3@cervezas.com', estado: 'aprobado',  aprobadoPor: 'admin@cervezas.com', items: [['Witbier Cítrica', 3], ['APA Sesionable', 2]] },
  { cliente: 'cliente3@cervezas.com', estado: 'pendiente', items: [['Märzen de Octubre', 1]] },
];

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log('== Usuarios ==');
  const usuariosPorEmail = {};
  for (const u of USUARIOS) {
    const existe = await userRepo.findUserByEmail(u.email);
    if (existe) { usuariosPorEmail[u.email] = existe; console.log(`  (ya existe) ${u.email}`); continue; }
    usuariosPorEmail[u.email] = await userRepo.createUser({ ...u, password: hash });
    console.log(`  + ${u.rol.padEnd(9)} ${u.email}`);
  }

  console.log('== Cervezas ==');
  const existentes = await cervezaRepo.getAllCervezas();
  const cervezaPorNombre = {};
  existentes.forEach((c) => { cervezaPorNombre[c.nombre] = c; });
  for (const c of CERVEZAS) {
    if (cervezaPorNombre[c.nombre]) { console.log(`  (ya existe) ${c.nombre}`); continue; }
    cervezaPorNombre[c.nombre] = await cervezaRepo.createCerveza(c);
    console.log(`  + ${c.nombre} (${c.tipo}) stock ${c.stock_actual}`);
  }

  console.log('== Pedidos ==');
  const pedidosExistentes = await pedidoRepo.getAllPedidos();
  if (pedidosExistentes.length > 0) {
    console.log(`  (ya hay ${pedidosExistentes.length} pedidos, no agrego más)`);
  } else {
    for (const p of PEDIDOS) {
      const cliente = usuariosPorEmail[p.cliente];
      const cervezas = p.items
        .map(([nombre, cantidad]) => {
          const c = cervezaPorNombre[nombre];
          return c ? { cerveza: c._id, cantidad } : null;
        })
        .filter(Boolean);
      if (!cliente || cervezas.length === 0) continue;

      const data = { usuario_id: cliente._id, estado: p.estado, cervezas };
      if (p.estado === 'aprobado' && p.aprobadoPor && usuariosPorEmail[p.aprobadoPor]) {
        data.aprobado_por = usuariosPorEmail[p.aprobadoPor]._id;
        data.fecha_aprobacion = new Date().toISOString();
      }
      await pedidoRepo.createPedido(data);
      console.log(`  + ${p.estado.padEnd(9)} de ${p.cliente} (${cervezas.length} ítem/s)`);
    }
  }

  console.log(`\n✅ Seed completo. Login de prueba (password para todos: ${PASSWORD}):`);
  USUARIOS.forEach((u) => console.log(`   - ${u.rol.padEnd(9)} ${u.email}`));
}

seed().then(() => process.exit(0)).catch((e) => { console.error('Seed error:', e); process.exit(1); });
