// Repositorio de administración de usuarios sobre DynamoDB.
const { PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { docClient, TABLES } = require('../database/dynamoClient');

const TABLE = TABLES.USUARIOS;
const ROLES_VALIDOS = ['admin', 'empleado', 'cliente'];

const sinPassword = (u) => {
  if (!u) return u;
  const { password, ...resto } = u;
  return resto;
};

exports.createEmpleado = async (userData) => {
  try {
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
  } catch (error) {
    console.error('REPOSITORY - createEmpleado - Error:', error.message);
    throw new Error('Error al intentar crear el nuevo usuario: ' + error.message);
  }
};

// Trae todos los usuarios SIN el campo password (no exponer el hash).
exports.getAllUsuariosRepository = async () => {
  try {
    const { Items } = await docClient.send(new ScanCommand({ TableName: TABLE }));
    return (Items || []).map(sinPassword);
  } catch (error) {
    console.error('Error en getAllUsuariosRepository:', error.message);
    throw new Error('Error al traer los usuarios: ' + error.message);
  }
};

// Actualiza un usuario y devuelve el doc actualizado sin password. Valida el enum de rol.
exports.updateUsuario = async (id, updateData) => {
  try {
    if (updateData.rol !== undefined && !ROLES_VALIDOS.includes(updateData.rol)) {
      throw new Error('Rol no válido');
    }

    const campos = ['nombre', 'email', 'rol', 'activo', 'password']
      .filter((k) => updateData[k] !== undefined);
    if (campos.length === 0) return sinPassword(await getById(id));

    const names = { '#upd': 'updatedAt' };
    const values = { ':upd': new Date().toISOString() };
    const sets = ['#upd = :upd'];
    campos.forEach((k, i) => {
      names[`#f${i}`] = k;
      values[`:v${i}`] = updateData[k];
      sets.push(`#f${i} = :v${i}`);
    });

    const { Attributes } = await docClient.send(new UpdateCommand({
      TableName: TABLE, Key: { _id: id },
      UpdateExpression: 'SET ' + sets.join(', '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return sinPassword(Attributes);
  } catch (error) {
    console.error('[Usuario Repository] Error en updateUsuario:', error.message);
    throw new Error(`Error al actualizar el usuario con ID ${id}: ${error.message}`);
  }
};

// Helper interno por si updateUsuario se llama sin campos.
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const getById = async (id) => {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { _id: id } }));
  return Item || null;
};
