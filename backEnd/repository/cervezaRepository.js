// Repositorio de Cervezas sobre DynamoDB (tabla con clave de partición `_id`).
// Mantiene las MISMAS firmas y el campo `_id` que la versión Mongoose, así que
// controllers, services y front no cambian.
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { docClient, TABLES } = require('../database/dynamoClient');

const TABLE = TABLES.CERVEZAS;

const createCerveza = async (cervezaData) => {
  const now = new Date().toISOString();
  const cerveza = {
    _id: randomUUID(),
    nombre: cervezaData.nombre,
    tipo: cervezaData.tipo,
    stock_actual: cervezaData.stock_actual ?? 0,
    stock_minimo: cervezaData.stock_minimo ?? 0,
    activo: cervezaData.activo ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: cerveza }));
  return cerveza;
};

const getAllCervezas = async () => {
  const { Items } = await docClient.send(new ScanCommand({ TableName: TABLE }));
  return Items || [];
};

const getCervezaById = async (id) => {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { _id: id } }));
  return Item || null;
};

const deleteCervezaById = async (id) => {
  const { Attributes } = await docClient.send(new DeleteCommand({
    TableName: TABLE, Key: { _id: id }, ReturnValues: 'ALL_OLD',
  }));
  return Attributes || null;
};

const updateCerveza = async (id, updateData) => {
  if (updateData.stock_actual !== undefined && updateData.stock_actual < 0) {
    const error = new Error('El stock_actual no puede ser negativo'); error.status = 400; throw error;
  }
  if (updateData.stock_minimo !== undefined && updateData.stock_minimo < 0) {
    const error = new Error('El stock_minimo no puede ser negativo'); error.status = 400; throw error;
  }

  // Update dinámico: sólo los campos provistos. Se usan alias (#f0, :v0...) para evitar
  // colisiones con palabras reservadas de DynamoDB.
  const campos = ['nombre', 'tipo', 'stock_actual', 'stock_minimo', 'activo']
    .filter((k) => updateData[k] !== undefined);
  if (campos.length === 0) return await getCervezaById(id);

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
  return Attributes || null;
};

const descontarStockActualById = async (id, cantidad) => {
  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: TABLE, Key: { _id: id },
    UpdateExpression: 'SET updatedAt = :upd ADD stock_actual :neg',
    ExpressionAttributeValues: { ':neg': -cantidad, ':upd': new Date().toISOString() },
    ReturnValues: 'ALL_NEW',
  }));
  return Attributes || null;
};

// Descuento atómico y condicional: sólo descuenta si hay stock suficiente.
// Devuelve true si descontó, false si no había stock (evita sobreventa por concurrencia).
const descontarStockSiHay = async (id, cantidad) => {
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE, Key: { _id: id },
      UpdateExpression: 'SET updatedAt = :upd ADD stock_actual :neg',
      ConditionExpression: 'stock_actual >= :cant',
      ExpressionAttributeValues: { ':neg': -cantidad, ':cant': cantidad, ':upd': new Date().toISOString() },
    }));
    return true;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false;
    throw err;
  }
};

// Restituye stock (al rechazar/eliminar un pedido, o para revertir un descuento parcial).
const restituirStock = async (id, cantidad) => {
  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: TABLE, Key: { _id: id },
    UpdateExpression: 'SET updatedAt = :upd ADD stock_actual :cant',
    ExpressionAttributeValues: { ':cant': cantidad, ':upd': new Date().toISOString() },
    ReturnValues: 'ALL_NEW',
  }));
  return Attributes || null;
};

module.exports = {
  createCerveza,
  getCervezaById,
  getAllCervezas,
  descontarStockActualById,
  descontarStockSiHay,
  restituirStock,
  deleteCervezaById,
  updateCerveza,
};
