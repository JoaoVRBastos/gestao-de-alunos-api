import { expect } from 'chai';
import api from './helpers/api.js';
import { loginAdmin, loginAluno } from './helpers/login.js';
import { carregarDados, tornarAlunoUnico } from './helpers/dados.js';

const { aluno: dadosAluno, disciplinasMatriculadas, entregasValidas, entregasInvalidas, alunoDeOutroCadastro } =
  carregarDados('trabalhos.json');

describe('POST /api/alunos/:alunoId/trabalhos', () => {
  let tokenAdmin;
  let tokenAluno;
  let alunoId;

  before(async () => {
    // 1. Login como administrador
    tokenAdmin = await loginAdmin();

    // 2. Administrador cadastra o aluno
    const aluno = tornarAlunoUnico(dadosAluno);
    const cadastro = await api
      .post('/api/admin/alunos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(aluno);
    expect(cadastro.status, 'cadastro do aluno').to.equal(201);
    alunoId = cadastro.body.id;

    // 3. Administrador matricula o aluno nas disciplinas (pré-requisito para entregar trabalhos)
    for (const disciplinaId of disciplinasMatriculadas) {
      const matricula = await api
        .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ alunoId });
      expect(matricula.status, `matrícula em ${disciplinaId}`).to.equal(201);
    }

    // 4. Login como aluno
    tokenAluno = await loginAluno(aluno.email, aluno.senha);
  });

  after(async () => {
    if (alunoId) {
      await api.delete(`/api/admin/alunos/${alunoId}`).set('Authorization', `Bearer ${tokenAdmin}`);
    }
  });

  entregasValidas.forEach(({ descricao, trabalho }) => {
    it(`deve retornar 201 quando o aluno registrar a entrega de um trabalho ${descricao}`, async () => {
      const resposta = await api
        .post(`/api/alunos/${alunoId}/trabalhos`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send(trabalho);

      expect(resposta.status).to.equal(201);
      expect(resposta.body.id).to.be.a('string').and.not.be.empty;
      expect(resposta.body).to.include({
        alunoId,
        disciplinaId: trabalho.disciplinaId,
        titulo: trabalho.titulo,
        descricao: trabalho.descricao ?? null,
        status: 'entregue',
        nota: null,
      });
      expect(new Date(resposta.body.dataEntrega).toString()).to.not.equal('Invalid Date');

      // A entrega deve aparecer na lista de trabalhos do aluno.
      const lista = await api
        .get(`/api/alunos/${alunoId}/trabalhos`)
        .set('Authorization', `Bearer ${tokenAluno}`);
      expect(lista.status).to.equal(200);
      expect(lista.body.map((t) => t.id)).to.include(resposta.body.id);
    });
  });

  entregasInvalidas.forEach(({ descricao, trabalho, status, erro }) => {
    it(`deve retornar ${status} quando ${descricao}`, async () => {
      const resposta = await api
        .post(`/api/alunos/${alunoId}/trabalhos`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send(trabalho);

      expect(resposta.status).to.equal(status);
      expect(resposta.body.error).to.equal(erro);
    });
  });

  it('deve retornar 403 quando o aluno tentar registrar um trabalho em nome de outro aluno', async () => {
    const resposta = await api
      .post(`/api/alunos/${alunoDeOutroCadastro}/trabalhos`)
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send(entregasValidas[0].trabalho);

    expect(resposta.status).to.equal(403);
    expect(resposta.body.error).to.equal('Você só pode acessar os seus próprios dados.');
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const resposta = await api
      .post(`/api/alunos/${alunoId}/trabalhos`)
      .send(entregasValidas[0].trabalho);

    expect(resposta.status).to.equal(401);
    expect(resposta.body.error).to.equal('Token de autenticação não informado.');
  });
});
