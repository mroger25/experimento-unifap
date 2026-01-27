class ExperimentoMTS {
  constructor() {
    // Configurações e Estado
    this.fase = 2; // Começa na Fase 2 (Treino)
    this.formas = ["quadrado", "circulo", "triangulo"];
    this.tentativaTotal = 0;
    this.tentativaNoBloco = 0;
    this.historicoBloco = []; // Reseta a cada 10 tentativas
    this.dadosCompletos = []; // Salva tudo para o CSV
    this.participanteID = "";

    // Elementos do DOM
    this.elAreaModelo = document.getElementById("area-modelo");
    this.elAreaEscolhas = document.getElementById("area-escolhas");
    this.elContainerEscolhas = document.getElementById("container-escolhas");
    this.elFeedback = document.getElementById("feedback-area");
    this.modeloAtual = null;
  }

  iniciar() {
    const idInput = document.getElementById("participante-id").value;
    if (!idInput) {
      alert("Por favor, insira um código para o participante.");
      return;
    }
    this.participanteID = idInput;

    document.getElementById("instrucoes").classList.add("hidden");
    document.getElementById("area-experimento").classList.remove("hidden");
    document.getElementById("fase-display").classList.remove("hidden");

    this.novaTentativa();
  }

  novaTentativa() {
    // Limpa estado visual
    this.elAreaEscolhas.innerHTML = "";
    this.elFeedback.innerText = "";
    this.elAreaModelo.innerHTML = "";
    this.elContainerEscolhas.classList.add("hidden"); // Esconde escolhas até clicar no modelo

    // 1. Define o Modelo da vez (Aleatório)
    this.modeloAtual =
      this.formas[Math.floor(Math.random() * this.formas.length)];

    // 2. Renderiza o Modelo
    const divModelo = this.criarElementoForma(this.modeloAtual);

    // O participante deve clicar no modelo para habilitar as escolhas (Resposta de observação)
    divModelo.onclick = () => {
      // Remove o click do modelo para não reativar
      divModelo.onclick = null;
      divModelo.style.cursor = "default";
      divModelo.style.opacity = "0.7";
      this.mostrarEscolhas();
    };

    this.elAreaModelo.appendChild(divModelo);
  }

  mostrarEscolhas() {
    this.elContainerEscolhas.classList.remove("hidden");

    // Gera array embaralhado das opções
    const opcoes = this.embaralharArray([...this.formas]);

    opcoes.forEach((forma) => {
      const divOpcao = this.criarElementoForma(forma);

      // Evento de escolha (Clique na comparação)
      divOpcao.onclick = () => {
        this.registrarResposta(forma);
      };
      this.elAreaEscolhas.appendChild(divOpcao);
    });
  }

  registrarResposta(escolhaFeita) {
    // Trava novos cliques
    this.elAreaEscolhas.innerHTML = "";

    const acertou = escolhaFeita === this.modeloAtual;
    const timestamp = new Date().toLocaleTimeString();

    // Atualiza contadores
    this.tentativaTotal++;
    this.tentativaNoBloco++;
    this.historicoBloco.push(acertou);

    // Salva dados para exportação
    this.dadosCompletos.push({
      participante: this.participanteID,
      fase: this.fase,
      tentativa_geral: this.tentativaTotal,
      tentativa_bloco: this.tentativaNoBloco,
      modelo: this.modeloAtual,
      escolha: escolhaFeita,
      resultado: acertou ? "ACERTO" : "ERRO",
      hora: timestamp,
    });

    // Lógica de Feedback (VI)
    if (this.fase === 2) {
      // Fase 2: Com Feedback
      const msg = acertou ? "ACERTOU!" : "ERROU!";
      const cor = acertou ? "green" : "red";
      this.mostrarFeedback(msg, cor);
    } else {
      // Fase 3: Extinção (Sem Feedback)
      // Apenas delay silencioso
      setTimeout(() => this.checarFimDeBloco(), 1000);
    }
  }

  mostrarFeedback(texto, cor) {
    this.elFeedback.innerText = texto;
    this.elFeedback.style.color = cor;

    // Tempo de exposição do feedback
    setTimeout(() => {
      this.checarFimDeBloco();
    }, 1500);
  }

  checarFimDeBloco() {
    // Verifica se completou bloco de 10 tentativas
    if (this.tentativaNoBloco >= 10) {
      this.avaliarCriterioMudanca();
      // Reseta contador do bloco e histórico
      this.tentativaNoBloco = 0;
      this.historicoBloco = [];
    }

    // Se o experimento não acabou, vai para próxima
    if (
      document.getElementById("fim-experimento").classList.contains("hidden")
    ) {
      this.novaTentativa();
    }
  }

  avaliarCriterioMudanca() {
    const acertos = this.historicoBloco.filter((x) => x === true).length;
    console.log(`Fim do bloco. Fase: ${this.fase}, Acertos: ${acertos}/10`);

    if (this.fase === 2) {
      // Critério para sair da Fase 2: 9 ou 10 acertos
      if (acertos >= 9) {
        this.fase = 3;
        console.log("--> Mudança para Fase 3 (Extinção)");
        // Nota: Não avisamos o participante!
      }
    } else if (this.fase === 3) {
      // Critério para encerrar Fase 3 (Extinção instalada)
      // O PDF diz: "deixar de escolher a correta por pelo menos 9 de 10"
      // Isso significa Acertos <= 1
      if (acertos <= 1) {
        this.encerrarExperimento();
      }
    }
  }

  encerrarExperimento() {
    document.getElementById("area-experimento").classList.add("hidden");
    document.getElementById("fim-experimento").classList.remove("hidden");
  }

  baixarCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Participante,Fase,TentativaGeral,TentativaBloco,Modelo,Escolha,Resultado,Hora\n";

    this.dadosCompletos.forEach((row) => {
      csvContent += `${row.participante},${row.fase},${row.tentativa_geral},${row.tentativa_bloco},${row.modelo},${row.escolha},${row.resultado},${row.hora}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dados_${this.participanteID}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  // Utilitários
  criarElementoForma(tipo) {
    const div = document.createElement("div");
    div.className = `forma ${tipo}`;
    return div;
  }

  embaralharArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }
}

// Inicializa a classe
const experimento = new ExperimentoMTS();
