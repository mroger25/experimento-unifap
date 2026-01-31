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
      setTimeout(() => {
        this.iniciarITI();
      }, 500);
    }
  }

  mostrarFeedback(texto, cor) {
    this.elFeedback.innerText = texto;
    this.elFeedback.style.color = cor;

    // Tempo de exposição do feedback
    setTimeout(() => {
      this.iniciarITI();
    }, 1500);
  }

  // A "Tela Branca"
  iniciarITI() {
    // Limpa visualmente o feedback anterior
    this.elFeedback.innerText = "";
    this.elAreaEscolhas.innerHTML = "";
    this.elAreaModelo.innerHTML = "";
    this.elContainerEscolhas.classList.add("hidden");

    // Adiciona classe que esconde a interface (Tela Branca)
    document.body.classList.add("iti-ativo");

    // Espera 1.0 segundo (duração do ITI)
    setTimeout(() => {
      document.body.classList.remove("iti-ativo");
      this.checarFimDeBloco(); // Só avança depois do intervalo
    }, 1000);
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
      // Acertos <= 1
      if (acertos <= 1) {
        this.encerrarExperimento();
      }
    }
  }

  encerrarExperimento() {
    document.getElementById("area-experimento").classList.add("hidden");
    document.getElementById("fim-experimento").classList.remove("hidden");

    this.gerarRelatorioNaTela();
  }

  gerarRelatorioNaTela() {
    const divRelatorio = document.getElementById("relatorio-resumo");

    // Filtra dados por fase
    const tentativasFase2 = this.dadosCompletos.filter((d) => d.fase === 2);
    const tentativasFase3 = this.dadosCompletos.filter((d) => d.fase === 3);

    // Calcula acertos
    const acertosF2 = tentativasFase2.filter(
      (d) => d.resultado === "ACERTO",
    ).length;
    const errosF2 = tentativasFase2.length - acertosF2;

    const acertosF3 = tentativasFase3.filter(
      (d) => d.resultado === "ACERTO",
    ).length;
    const errosF3 = tentativasFase3.length - acertosF3;

    // Monta o HTML da tabela
    divRelatorio.innerHTML = `
            <table class="tabela-resumo">
                <thead>
                    <tr>
                        <th>Fase</th>
                        <th>Tentativas</th>
                        <th>Acertos</th>
                        <th>Erros</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>2 (Treino)</strong></td>
                        <td>${tentativasFase2.length}</td>
                        <td style="color:green">${acertosF2}</td>
                        <td style="color:red">${errosF2}</td>
                    </tr>
                    <tr>
                        <td><strong>3 (Extinção)</strong></td>
                        <td>${tentativasFase3.length}</td>
                        <td style="color:green">${acertosF3}</td>
                        <td style="color:red">${errosF3}</td>
                    </tr>
                    <tr>
                        <td><strong>TOTAL</strong></td>
                        <td><strong>${this.dadosCompletos.length}</strong></td>
                        <td>${acertosF2 + acertosF3}</td>
                        <td>${errosF2 + errosF3}</td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top:10px; font-size:12px; color:#666;">
                *Fase 2 Critério: 9/10 acertos.<br>
                *Fase 3 Critério: 9/10 erros (ou <= 1 acerto).
            </p>
        `;
    this.gerarGrafico();
  }

  gerarGrafico() {
    const ctx = document.getElementById("meuGrafico").getContext("2d");

    // 1. Processar dados para o Registro Cumulativo
    const labels = []; // Número da tentativa (eixo X)
    const dadosAcumulados = []; // Total de acertos até o momento (eixo Y)
    const coresPonto = []; // Cor diferente para cada fase

    let acertosTotal = 0;

    this.dadosCompletos.forEach((dado, index) => {
      labels.push(index + 1); // Tentativa 1, 2, 3...

      if (dado.resultado === "ACERTO") {
        acertosTotal++;
      }
      dadosAcumulados.push(acertosTotal);

      // Define cor do ponto baseada na fase
      if (dado.fase === 2) {
        coresPonto.push("blue"); // Fase de Treino
      } else {
        coresPonto.push("orange"); // Fase de Extinção
      }
    });

    // 2. Criar o Gráfico
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Acertos Acumulados",
            data: dadosAcumulados,
            borderColor: "#333",
            borderWidth: 2,
            pointBackgroundColor: coresPonto, // Pontos mudam de cor na fase
            pointRadius: 4,
            fill: false,
            tension: 0.1, // Linha levemente reta (padrão Skinneriano)
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Curva de Aprendizagem Cumulada",
          },
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                // Mostra a fase no tooltip ao passar o mouse
                const index = context.dataIndex;
                const fase =
                  coresPonto[index] === "blue"
                    ? "Fase 2 (Reforço)"
                    : "Fase 3 (Extinção)";
                return fase;
              },
            },
          },
          legend: {
            display: false, // Esconde legenda padrão para limpar a tela
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Número da Tentativa" },
          },
          y: {
            title: { display: true, text: "Acertos Acumulados" },
            beginAtZero: true,
            ticks: { stepSize: 1 }, // Garante números inteiros no eixo Y
          },
        },
      },
    });
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
