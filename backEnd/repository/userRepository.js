// Repositorio de Usuarios (auth) sobre DynamoDB.
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { docClient, TABLES } = require('../database/dynamoClient');

const TABLE = TABLES.USUARIOS;

const createUser = async (userData) => {
  const now = new Date().toISOString();
  const user = {
    _id: randomUUID(),
    nombre: userData.nombre,
    email: userData.email,
    password: userData.password,
    rol: userData.rol || 'cliente',
    activo: userData.activo ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: user }));
  return user;
};

const findUserByEmail = async (email) => {
  // Coerción a string para evitar inyección (ej. objetos en el body).
  const emailStr = typeof email === 'string' ? email : '';
  const { Items } = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: '#email = :e',
    ExpressionAttributeNames: { '#email': 'email' },
    ExpressionAttributeValues: { ':e': emailStr },
  }));
  return (Items && Items[0]) || null;
};

module.exports = {
  createUser,
  findUserByEmail,
};
