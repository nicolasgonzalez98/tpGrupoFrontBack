// Repositorio de Pedidos sobre DynamoDB.
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { docClient, TABLES } = require('../database/dynamoClient');

const TABLE = TABLES.PEDIDOS;
const ESTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];

const createPedido = async (pedidoData) => {
  const now = new Date().toISOString();
  const pedido = {
    _id: randomUUID(),
    usuario_id: pedidoData.usuario_id,
    fecha: pedidoData.fecha || now,
    estado: pedidoData.estado || 'pendiente',
    aprobado_por: pedidoData.aprobado_por ?? null,
    fecha_aprobacion: pedidoData.fecha_aprobacion ?? null,
    cervezas: (pedidoData.cervezas || []).map((c) => ({ cerveza: c.cerveza, cantidad: c.cantidad })),
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: pedido }));
  return pedido;
};

const getAllPedidos = async () => {
  const { Items } = await docClient.send(new ScanCommand({ TableName: TABLE }));
  return Items || [];
};

const getPedidoById = async (id) => {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { _id: id } }));
  return Item || null;
};

const getPedidosByUsuario = async (usuarioId) => {
  const { Items } = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'usuario_id = :u',
    ExpressionAttributeValues: { ':u': usuarioId },
  }));
  return Items || [];
};

const deletePedidoById = async (id) => {
  const { Attributes } = await docClient.send(new DeleteCommand({
    TableName: TABLE, Key: { _id: id }, ReturnValues: 'ALL_OLD',
  }));
  return Attributes || null;
};

const updatePedido = async (id, { aprobado_por, estado }) => {
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    throw new Error('Estado no válido');
  }

  const names = { '#upd': 'updatedAt' };
  const values = { ':upd': new Date().toISOString() };
  const sets = ['#upd = :upd'];

  if (aprobado_por) { names['#ap'] = 'aprobado_por'; values[':ap'] = aprobado_por; sets.push('#ap = :ap'); }
  if (estado) { names['#es'] = 'estado'; values[':es'] = estado; sets.push('#es = :es'); }
  if (estado === 'aprobado') { names['#fa'] = 'fecha_aprobacion'; values[':fa'] = new Date().toISOString(); sets.push('#fa = :fa'); }

  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: TABLE, Key: { _id: id },
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return Attributes || null;
};

module.exports = {
  createPedido,
  getAllPedidos,
  getPedidoById,
  getPedidosByUsuario,
  deletePedidoById,
  updatePedido,
};
