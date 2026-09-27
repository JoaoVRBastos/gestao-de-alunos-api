import api from './api.js';

async function login(email, senha) {
  const resposta = await api.post('/api/auth/login').send({ email, senha });

  if (resposta.status !== 200) {
    throw new Error(
      `Falha no login de "${email}": status ${resposta.status} - ${JSON.stringify(resposta.body)}`
    );
  }

  return resposta.body.token;
}

// Login do administrador pré-cadastrado; as credenciais vêm do .env.
export async function loginAdmin() {
  return login(process.env.ADMIN_EMAIL, process.env.ADMIN_SENHA);
}

// Login de um aluno com as credenciais informadas.
export async function loginAluno(email, senha) {
  return login(email, senha);
}
