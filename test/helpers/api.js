import 'dotenv/config';
import request from 'supertest';

if (!process.env.BASE_URL) {
  throw new Error('Variável BASE_URL não definida. Copie o arquivo .env.example para .env.');
}

// Cliente Supertest apontando para a API em execução (BASE_URL vem do .env).
const api = request(process.env.BASE_URL);

export default api;
