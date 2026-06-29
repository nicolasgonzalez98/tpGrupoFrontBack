// Cliente de DynamoDB (AWS SDK v3).
// - La región sale de AWS_REGION / AWS_DEFAULT_REGION (en la EC2 = us-east-1).
// - Las credenciales las toma del rol de la instancia EC2 (LabInstanceProfile)
//   automáticamente, vía la cadena de credenciales por defecto. NO hay claves en el código.
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// El DocumentClient convierte objetos JS <-> tipos de DynamoDB automáticamente.
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// Nombres de tabla (se pueden override por env si hiciera falta).
const TABLES = {
  CERVEZAS: process.env.TABLA_CERVEZAS || 'Cervezas',
  PEDIDOS: process.env.TABLA_PEDIDOS || 'Pedidos',
  USUARIOS: process.env.TABLA_USUARIOS || 'Usuarios',
};

module.exports = { docClient, TABLES };
