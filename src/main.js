

import "./style.css";

document.querySelector("#app").innerHTML = `
  <section id="tela-login">
  <h1>ConectaDoa</h1>
  <h2>Acesso do administrador</h2>

  <form id="form-login">
    <input name="email" type="email" placeholder="E-mail" required>
    <input name="senha" type="password" placeholder="Senha" required>
    <button type="submit">Entrar</button>
  </form>

  <p id="mensagem-login"></p>
</section>

<main id="area-sistema" hidden>
    <h1>ConectaDoa</h1>
    <button id="btn-sair" type="button">Sair</button>
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
      <hr>

      <h2>Registrar doação</h2>

      <form id="form-doacao">
        <select id="doacao-doador" required>
          <option value="">Selecione o doador</option>
        </select>

        <select id="doacao-item" required>
          <option value="">Selecione o item</option>
        </select>

        <input
          type="number"
          id="doacao-quantidade"
          min="1"
          value="1"
          required
          placeholder="Quantidade"
        >

        <button type="submit">Registrar doação</button>
      </form>

      <p id="mensagem-doacao"></p>

      <hr>

      <h2>Histórico de doações</h2>
      <ul id="lista-doacoes"></ul>
  </main>
`;
document.querySelector("#btn-sair").addEventListener("click", () => {
  sessionStorage.removeItem("token");
  document.querySelector("#area-sistema").hidden = true;
  document.querySelector("#tela-login").hidden = false;
});

document.querySelector("#form-login").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const formulario = evento.target;
  const dados = Object.fromEntries(new FormData(formulario));
  const mensagem = document.querySelector("#mensagem-login");

  try {
    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Falha ao realizar login");
    }

    sessionStorage.setItem("token", resultado.token);

    document.querySelector("#tela-login").hidden = true;
    document.querySelector("#area-sistema").hidden = false;

    formulario.reset();
    mensagem.textContent = "";

    await carregarDados();
    await carregarFormularioDoacao();
    await carregarHistoricoDoacoes();

  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});
async function apiFetch(url, opcoes = {}) {
  const token = sessionStorage.getItem("token");

  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      ...opcoes.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (resposta.status === 401 || resposta.status === 403) {
    sessionStorage.removeItem("token");
    document.querySelector("#tela-login").hidden = false;
    document.querySelector("#area-sistema").hidden = true;
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.erro || `Erro na requisição: ${resposta.status}`);
  }

  return resposta;
}
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
      apiFetch("/api/doadores").then(r => r.json()),
      apiFetch("/api/categorias").then(r => r.json()),
      apiFetch("/api/itens").then(r => r.json())
    ]);

    const listaDoadores = document.querySelector("#lista-doadores");
    listaDoadores.replaceChildren();
    doadores.forEach(d => {
      const li = document.createElement("li");
      li.textContent = `${d.nome} - ${d.email}`;
      listaDoadores.appendChild(li);
    });

    const listaCategorias = document.querySelector("#lista-categorias");
    listaCategorias.replaceChildren();
    categorias.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.nome;
      listaCategorias.appendChild(li);
    });

    const listaItens = document.querySelector("#lista-itens");
    listaItens.replaceChildren();
    itens.forEach(i => {
      const li = document.createElement("li");
      li.textContent = `${i.nome} - ${i.quantidade} unidades (${i.categoria})`;
      listaItens.appendChild(li);
    });

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
    const resposta = await apiFetch("/api/doadores", {
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

// Carregar opções do formulário de doação
async function carregarFormularioDoacao() {
  try {
    const [doadores, itens] = await Promise.all([
      apiFetch("/api/doadores").then(r => r.json()),
      apiFetch("/api/itens").then(r => r.json())
    ]);

    const seletorDoador = document.querySelector("#doacao-doador");
    const seletorItem = document.querySelector("#doacao-item");

    seletorDoador.replaceChildren();
    doadores.forEach(d => {
      const opcao = document.createElement("option");
      opcao.value = d.id;
      opcao.textContent = d.nome;
      seletorDoador.appendChild(opcao);
    });

    seletorItem.replaceChildren();
    itens.forEach(i => {
      const opcao = document.createElement("option");
      opcao.value = i.id;
      opcao.textContent = i.nome;
      seletorItem.appendChild(opcao);
    });

  } catch (erro) {
    console.error("Erro ao carregar formulário:", erro);
  }
}

// Registrar doação
document.querySelector("#form-doacao").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const doador_id = Number(document.querySelector("#doacao-doador").value);
  const item_id = Number(document.querySelector("#doacao-item").value);
  const quantidade = Number(document.querySelector("#doacao-quantidade").value);
  const mensagem = document.querySelector("#mensagem-doacao");

  try {
    const resposta = await apiFetch("/api/doacoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        doador_id,
        itens: [{ item_id, quantidade }]
      })
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Erro ao registrar doação");
    }

    mensagem.textContent = "Doação registrada com sucesso!";
    evento.target.reset();

    await carregarHistoricoDoacoes();

  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});

// Consultar histórico
async function carregarHistoricoDoacoes() {
  try {
    const resposta = await apiFetch("/api/doacoes");
    const doacoes = await resposta.json();

    const listaDoacoes = document.querySelector("#lista-doacoes");
    listaDoacoes.replaceChildren();

    doacoes.forEach(d => {
      const li = document.createElement("li");
      li.textContent = `${d.doador} - ${d.item} - Quantidade: ${d.quantidade} - Status: ${d.status}`;
      listaDoacoes.appendChild(li);
    });

  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
  }
}
