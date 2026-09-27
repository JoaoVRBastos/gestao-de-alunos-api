import fs from 'node:fs';

// Lê um arquivo JSON da pasta test/data (massa de dados dos testes data-driven).
export function carregarDados(nomeArquivo) {
  const caminho = new URL(`../data/${nomeArquivo}`, import.meta.url);
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

// E-mail e matrícula são únicos na API; o sufixo permite reexecutar os testes no mesmo banco.
export function tornarAlunoUnico(aluno) {
  const sufixo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const [usuario, dominio] = aluno.email.split('@');

  return {
    ...aluno,
    email: `${usuario}.${sufixo}@${dominio}`,
    matricula: `${aluno.matricula}-${sufixo}`,
  };
}
