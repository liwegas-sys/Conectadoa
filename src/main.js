

import "./style.css";

document.querySelector("#app").innerHTML = `
  <main>
    <h1>ConectaDoa</h1>
    <p>Projeto de apoio a organizações sociais.</p>

    <h2>Status da API: <strong id="api-status">Verificando...</strong></h2>
    <p id="api-hora"></p>

    <hr>

    <h2>Cadastrar doador</h2>

    <form id="form-doador">
      <input name="nome" placeholder="Nome completo" required>
      <input name="email" type="email" placeholder="E-mail" required>
      <input name="telefone" placeholder="Telefone">
      <button type="submit">Cadastrar doador</button>
    </form>

    <p id="mensagem"></p>

    <hr>

    <h2>Doadores cadastrados</h2>
    <ul id="lista-doadores"></ul>

    <hr>

    <h2>Categorias</h2>
    <ul id="lista-categorias"></ul>

    <hr>

    <h2>Itens disponíveis</h2>
    <ul id="lista-itens"></ul>
  </main>
`;

async function verificarAPI() {
  const status = document.querySelector("#api-status");
  const hora = document.querySelector("#api-hora");

  try {
    const resposta = await fetch("/api/health");
    const dados = await resposta.json();

    status.textContent = dados.status;

    const dataHora = new Date(dados.hora);
    hora.textContent = `Data e hora: ${dataHora.toLocaleString("pt-BR")}`;
  } catch (erro) {
    status.textContent = "API fora do ar";
  }
}

async function carregarDados() {
  try {
    const [doadores, categorias, itens] = await Promise.all([
      fetch("/api/doadores").then(r => r.json()),
      fetch("/api/categorias").then(r => r.json()),
      fetch("/api/itens").then(r => r.json())
    ]);

    document.querySelector("#lista-doadores").innerHTML =
      doadores.map(d => `<li>${d.nome} - ${d.email}</li>`).join("");

    document.querySelector("#lista-categorias").innerHTML =
      categorias.map(c => `<li>${c.nome}</li>`).join("");

    document.querySelector("#lista-itens").innerHTML =
      itens.map(i => `<li>${i.nome} - ${i.quantidade} unidades (${i.categoria})</li>`).join("");

  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

document.querySelector("#form-doador").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const formulario = evento.target;
  const dados = Object.fromEntries(new FormData(formulario));
  const mensagem = document.querySelector("#mensagem");

  try {
    const resposta = await fetch("/api/doadores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Erro ao cadastrar doador");
    }

    mensagem.textContent = "Doador cadastrado com sucesso!";
    formulario.reset();

    await carregarDados();

  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});

void verificarAPI();
void carregarDados();

