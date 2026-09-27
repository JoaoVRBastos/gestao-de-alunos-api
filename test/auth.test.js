import { expect } from 'chai';
import api from './helpers/api.js';
import { carregarDados } from './helpers/dados.js';

const { alunosPreCadastrados, credenciaisInvalidas } = carregarDados('login.json');

describe('POST /api/auth/login', () => {
  it('deve retornar 200, token e perfil admin quando o administrador fizer login', async () => {
    const resposta = await api
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA });

    expect(resposta.status).to.equal(200);
    expect(resposta.headers['content-type']).to.include('application/json');
    expect(resposta.body.token).to.be.a('string').and.not.be.empty;
    expect(resposta.body.usuario).to.include({ email: process.env.ADMIN_EMAIL, role: 'admin' });
    expect(resposta.body.usuario).to.not.have.property('senha');
  });

  alunosPreCadastrados.forEach(({ nome, email, senha }) => {
    it(`deve retornar 200, token e perfil aluno quando ${nome} fizer login`, async () => {
      const resposta = await api.post('/api/auth/login').send({ email, senha });

      expect(resposta.status).to.equal(200);
      expect(resposta.body.token).to.be.a('string').and.not.be.empty;
      expect(resposta.body.usuario).to.include({ nome, email, role: 'aluno' });
      expect(resposta.body.usuario).to.not.have.property('senha');
    });
  });

  credenciaisInvalidas.forEach(({ descricao, credenciais, status, erro }) => {
    it(`deve retornar ${status} quando ${descricao}`, async () => {
      const resposta = await api.post('/api/auth/login').send(credenciais);

      expect(resposta.status).to.equal(status);
      expect(resposta.body.error).to.equal(erro);
      expect(resposta.body).to.not.have.property('token');
    });
  });
});
