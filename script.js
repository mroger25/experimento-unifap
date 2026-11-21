class ExperimentoMTS {
  constructor() {
    // Estado
    this.fase = 2;
    this.formas = ["quadrado", "circulo", "triangulo"];
    this.tentativaNoBloco = 0;
    this.blocoAtual = 1;
    this.historicoBloco = [];
    this.dadosCompletos = [];
    this.participanteID = "";
    this.modeloAtual = null;

    // Controle de Treino e Proteção de Dados
    this.modoTreino = false;
    this.tentativasTreino = 0;
    this.experimentoIniciado = false;
    this.dadosSalvos = false;

    // Controle de Tempo (Latência)
    this.tempoInicioEscolha = 0;

    // Elementos DOM
    this.elAreaModelo = document.getElementById("area-modelo");
    this.elAreaEscolhas = document.getElementById("area-escolhas");
    this.elContainerEscolhas = document.getElementById("container-escolhas");
    this.elFeedback = document.getElementById("feedback-area");

    // Prevenção de perda de dados ao fechar/recarregar a página
    window.addEventListener("beforeunload", (e) => {
      if (this.experimentoIniciado && !this.dadosSalvos && !this.modoTreino) {
        e.preventDefault();
        e.returnValue =
          "Você tem dados não salvos. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    });
  }

  // --- MÓDULO 1 e 2 ---
  aceitarTermo() {
    const idInput = document.getElementById("participante-id").value.trim();
    if (!idInput) return alert("Por favor, insira o código do participante.");

    this.participanteID = idInput;
    document.getElementById("etapa-etica").classList.add("hidden");
    document.getElementById("etapa-instrucao").classList.remove("hidden");
  }

  repetirInstrucao() {
    alert(
      "Repita a instrução verbal para o participante e pergunte novamente o que ele deve fazer.",
    );
  }

  // --- MÓDULO DE TREINO (NOVO) ---
  iniciarTreino() {
    this.modoTreino = true;
    this.tentativasTreino = 0;
    document.getElementById("etapa-instrucao").classList.add("hidden");
    document.getElementById("area-experimento").classList.remove("hidden");
    alert(
      "Iniciando Treino Prático (3 tentativas). O experimentador deve explicar que este treino é apenas para familiarização.",
    );
    this.novaTentativa();
  }

  finalizarTreino() {
    this.modoTreino = false;
    this.elFeedback.innerText = "";
    document.getElementById("area-experimento").classList.add("hidden");
    document.getElementById("etapa-instrucao").classList.remove("hidden");
    alert("Treino concluído! Agora você pode iniciar o experimento oficial.");
  }

  iniciarFase2() {
    this.experimentoIniciado = true;
    document.getElementById("etapa-instrucao").classList.add("hidden");
    document.getElementById("area-experimento").classList.remove("hidden");
    this.novaTentativa();
  }

  // --- MÓDULO 3: FLUXO DA TENTATIVA ---
  novaTentativa() {
    // Reseta visual
    this.elAreaEscolhas.innerHTML = "";
    this.elFeedback.innerText = "";
    this.elAreaModelo.innerHTML = "";
    this.elContainerEscolhas.classList.add("hidden");

    // Define modelo aleatório
    this.modeloAtual =
      this.formas[Math.floor(Math.random() * this.formas.length)];
    const divModelo = this.criarElementoForma(this.modeloAtual);

    // Passo 1: Apresentação do modelo (Resposta de Observação)
    divModelo.onclick = () => {
      divModelo.onclick = null; // Evita duplo clique
      divModelo.style.opacity = "0.5"; // Feedback visual de que foi tocado
      this.mostrarEscolhas();
    };

    this.elAreaModelo.appendChild(divModelo);
  }

  mostrarEscolhas() {
    this.elContainerEscolhas.classList.remove("hidden");

    // Passo 2: Disponibilização dos 3 estímulos (Randomização Espacial)
    const opcoes = this.embaralharArray([...this.formas]);

    this.posicoesAtuais = {
      esquerda: opcoes[0],
      centro: opcoes[1],
      direita: opcoes[2],
    };

    this.tempoInicioEscolha = performance.now();

    opcoes.forEach((forma) => {
      const divOpcao = this.criarElementoForma(forma);

      // Passo 3: Captura da resposta de escolha
      divOpcao.onclick = () => {
        const tempoReacao = Math.round(
          performance.now() - this.tempoInicioEscolha,
        );
        this.registrarResposta(forma, tempoReacao);
      };
      this.elAreaEscolhas.appendChild(divOpcao);
    });
  }

  registrarResposta(escolhaFeita, latencia) {
    this.elAreaEscolhas.innerHTML = ""; // Trava novos cliques
    const acertou = escolhaFeita === this.modeloAtual;

    // Se estiver no modo treino, não salva dados nem avança blocos
    if (this.modoTreino) {
      this.tentativasTreino++;
      const msg = acertou ? "ACERTOU!" : "ERROU!";
      const cor = acertou ? "green" : "red";
      this.mostrarFeedback(msg, cor, true); // true indica que é treino
      return;
    }

    const timestamp = new Date().toLocaleTimeString();

    // Contadores Oficiais
    this.tentativaNoBloco++;
    this.historicoBloco.push(acertou);

    // Log Estruturado
    this.dadosCompletos.push({
      participante: this.participanteID,
      fase: this.fase,
      bloco: this.blocoAtual,
      tentativa_bloco: this.tentativaNoBloco,
      modelo: this.modeloAtual,
      pos_esquerda: this.posicoesAtuais.esquerda,
      pos_centro: this.posicoesAtuais.centro,
      pos_direita: this.posicoesAtuais.direita,
      escolha: escolhaFeita,
      resultado: acertou ? "ACERTO" : "ERRO",
      latencia_ms: latencia,
      hora: timestamp,
    });

    // MÓDULO 4 e 5: CONSEQUÊNCIAS E TRANSIÇÕES
    if (this.fase === 2) {
      const msg = acertou ? "ACERTOU!" : "ERROU!";
      const cor = acertou ? "green" : "red";
      this.mostrarFeedback(msg, cor, false);
    } else {
      // Fase 3: Extinção (Sem Feedback)
      this.iniciarITI();
    }
  }

  mostrarFeedback(texto, cor, isTreino) {
    this.elFeedback.innerText = texto;
    this.elFeedback.style.color = cor;

    setTimeout(() => {
      if (isTreino) {
        // Se for treino, passa para o ITI, mas depois checa se acabou
        this.iniciarITI(true);
      } else {
        this.iniciarITI(false);
      }
    }, 1500);
  }

  iniciarITI(isTreino = false) {
    this.elFeedback.innerText = "";
    document.body.classList.add("iti-ativo");

    setTimeout(() => {
      document.body.classList.remove("iti-ativo");
      if (isTreino) {
        if (this.tentativasTreino >= 3) {
          this.finalizarTreino();
        } else {
          this.novaTentativa();
        }
      } else {
        this.checarFimDeBloco();
      }
    }, 1000);
  }

  checarFimDeBloco() {
    if (this.tentativaNoBloco >= 10) {
      this.avaliarCriterioMudanca();

      if (
        !document.getElementById("fim-experimento").classList.contains("hidden")
      )
        return;

      this.blocoAtual++;
      this.tentativaNoBloco = 0;
      this.historicoBloco = [];
    }
    this.novaTentativa();
  }

  avaliarCriterioMudanca() {
    const acertos = this.historicoBloco.filter(Boolean).length;

    if (this.fase === 2 && acertos >= 9) {
      this.fase = 3; // Transição Cega
    } else if (this.fase === 3 && acertos <= 1) {
      this.encerrarExperimento();
    }
  }

  // --- MÓDULOS DE VISUALIZAÇÃO E EXPORTAÇÃO ---
  encerrarExperimento() {
    this.experimentoIniciado = false; // Desativa o alerta de beforeunload
    document.getElementById("area-experimento").classList.add("hidden");
    document.getElementById("fim-experimento").classList.remove("hidden");
    this.gerarRelatorioNaTela();
  }

  confirmarNovoParticipante() {
    if (!this.dadosSalvos && this.dadosCompletos.length > 0) {
      const confirmacao = confirm(
        "ATENÇÃO: Você ainda não baixou os dados deste participante. Se continuar, os dados serão perdidos permanentemente. Deseja realmente iniciar um novo participante?",
      );
      if (!confirmacao) return;
    }
    location.reload();
  }

  gerarRelatorioNaTela() {
    const f2 = this.dadosCompletos.filter((d) => d.fase === 2);
    const f3 = this.dadosCompletos.filter((d) => d.fase === 3);

    const acertosF2 = f2.filter((d) => d.resultado === "ACERTO").length;
    const acertosF3 = f3.filter((d) => d.resultado === "ACERTO").length;

    document.getElementById("relatorio-resumo").innerHTML = `
      <table class="tabela-resumo">
        <thead><tr><th>Fase</th><th>Tentativas</th><th>Acertos</th><th>Erros</th></tr></thead>
        <tbody>
          <tr><td><strong>2 (Treino)</strong></td><td>${f2.length}</td><td style="color:green">${acertosF2}</td><td style="color:red">${f2.length - acertosF2}</td></tr>
          <tr><td><strong>3 (Extinção)</strong></td><td>${f3.length}</td><td style="color:green">${acertosF3}</td><td style="color:red">${f3.length - acertosF3}</td></tr>
          <tr><td><strong>TOTAL</strong></td><td><strong>${this.dadosCompletos.length}</strong></td><td>${acertosF2 + acertosF3}</td><td>${f2.length - acertosF2 + (f3.length - acertosF3)}</td></tr>
        </tbody>
      </table>
    `;
    this.gerarGrafico();
  }

  gerarGrafico() {
    const ctx = document.getElementById("meuGrafico").getContext("2d");
    let acertosAcumulados = 0;
    const labels = [];
    const dados = [];
    const cores = [];

    this.dadosCompletos.forEach((d, i) => {
      labels.push(i + 1);
      if (d.resultado === "ACERTO") acertosAcumulados++;
      dados.push(acertosAcumulados);
      cores.push(d.fase === 2 ? "blue" : "orange");
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Acertos Acumulados",
            data: dados,
            borderColor: "#333",
            borderWidth: 2,
            pointBackgroundColor: cores,
            pointRadius: 4,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: "Tentativa Geral" } },
          y: {
            title: { display: true, text: "Acertos" },
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }

  baixarCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Participante,Fase,Bloco,Tentativa_Bloco,Modelo,Pos_Esquerda,Pos_Centro,Pos_Direita,Escolha,Resultado,Latencia_ms,Hora\n";

    this.dadosCompletos.forEach((r) => {
      csvContent += `${r.participante},${r.fase},${r.bloco},${r.tentativa_bloco},${r.modelo},${r.pos_esquerda},${r.pos_centro},${r.pos_direita},${r.escolha},${r.resultado},${r.latencia_ms},${r.hora}\n`;
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `dados_${this.participanteID}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Marca que os dados foram salvos, liberando o botão "Novo Participante" sem avisos
    this.dadosSalvos = true;
    document.getElementById("btn-salvar").innerText =
      "DADOS SALVOS! BAIXAR NOVAMENTE (.csv)";
  }

  // --- Utilitários ---
  criarElementoForma(tipo) {
    const div = document.createElement("div");
    div.className = `forma ${tipo}`;
    return div;
  }

  embaralharArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }
}

const experimento = new ExperimentoMTS();
