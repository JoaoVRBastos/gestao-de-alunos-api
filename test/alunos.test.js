import { expect } from 'chai';
import api from './helpers/api.js';
import { loginAdmin, loginAluno } from './helpers/login.js';
import { carregarDados, tornarAlunoUnico } from './helpers/dados.js';

const { alunosValidos, alunosInvalidos } = carregarDados('alunos.json');

describe('POST /api/admin/alunos', () => {
  let tokenAdmin;
  const idsCriados = [];

  before(async () => {
    tokenAdmin = await loginAdmin();
  });

  after(async () => {
    for (const id of idsCriados) {
      await api.delete(`/api/admin/alunos/${id}`).set('Authorization', `Bearer ${tokenAdmin}`);
    }
  });

  alunosValidos.forEach((dadosAluno) => {
    it(`deve retornar 201 quando o administrador cadastrar o aluno ${dadosAluno.nome}`, async () => {
      const aluno = tornarAlunoUnico(dadosAluno);

      const resposta = await api
        .post('/api/admin/alunos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(aluno);

      expect(resposta.status).to.equal(201);
      expect(resposta.body.id).to.be.a('string').and.not.be.empty;
      expect(resposta.body).to.include({
        nome: aluno.nome,
        email: aluno.email,
        matricula: aluno.matricula,
        role: 'aluno',
      });
      expect(resposta.body).to.not.have.property('senha');
      idsCriados.push(resposta.body.id);

      // A senha definida no cadastro deve permitir o primeiro acesso do aluno.
      const tokenAluno = await loginAluno(aluno.email, aluno.senha);
      expect(tokenAluno).to.be.a('string').and.not.be.empty;
    });
  });

  alunosInvalidos.forEach(({ descricao, aluno, status, erro }) => {
    it(`deve retornar ${status} quando ${descricao}`, async () => {
      const resposta = await api
        .post('/api/admin/alunos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(aluno);

      expect(resposta.status).to.equal(status);
      expect(resposta.body.error).to.equal(erro);
    });
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const resposta = await api.post('/api/admin/alunos').send(tornarAlunoUnico(alunosValidos[0]));

    expect(resposta.status).to.equal(401);
    expect(resposta.body.error).to.equal('Token de autenticação não informado.');
  });
});
