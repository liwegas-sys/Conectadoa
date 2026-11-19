import "./style.css";

document.querySelector("#app").innerHTML = `
  <main>
    <h1>ConectaDoa</h1>
    <p>Projeto de apoio a organizações sociais.</p>
    <h2>Status da API</h2>
    <p id="api-status">Verificando conexão...</p>
  </main>
`;

async function verificarAPI() {
  const status = document.querySelector("#api-status");

  try {
    const resposta = await fetch("/api/health");
    const dados = await resposta.json();

    status.textContent = `${dados.status} - ${dados.message}`;
  } catch (erro) {
    status.textContent = "Não foi possível conectar à API.";
    console.error(erro);
  }
}

void verificarAPI();
