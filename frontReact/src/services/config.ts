// URL base del backend. En el front Angular estaba hardcodeada en cada servicio
// (http://localhost:3000). Acá se centraliza en una constante.
// En AWS apunta al API Gateway (HTTPS), que reenvía al ALB -> EC2.
// Para desarrollo local contra un back local, cambiar por 'http://localhost:3000'.
export const API_URL = 'https://8eot5z7xp8.execute-api.us-east-1.amazonaws.com';
