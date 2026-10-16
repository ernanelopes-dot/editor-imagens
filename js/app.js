"use strict";

// ===== ELEMENTOS PRINCIPAIS =====

const botaoSelecionar = document.getElementById("selecionar-imagem");
const campoArquivo = document.getElementById("arquivo-imagem");
const areaUpload = document.querySelector(".upload-area");

const TAMANHO_MAXIMO = 20 * 1024 * 1024;
const DIMENSAO_MAXIMA = 10000;
const PIXELS_MAXIMOS = 40000000;

const FORMATOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

let imagemAtual = null;
let imagemTrabalho = null;
let imagemAnterior = null;
let urlImagemAnterior = null;
let urlImagemAtual = null;
let urlImagemTrabalho = null;
let urlResultadoAtual = null;
let urlRedimensionadaAtual = null;
let urlCortadaAtual = null;

// ===== SELEÇÃO DE ARQUIVOS =====

botaoSelecionar.addEventListener("click", () => {
    campoArquivo.click();
});

campoArquivo.addEventListener("change", () => {
    const arquivo = campoArquivo.files[0];

    if (arquivo) {
        validarArquivo(arquivo);
    }
});

// ===== ARRASTAR E SOLTAR =====

areaUpload.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    areaUpload.classList.add("arrastando");
});

areaUpload.addEventListener("dragleave", (evento) => {
    if (!areaUpload.contains(evento.relatedTarget)) {
        areaUpload.classList.remove("arrastando");
    }
});

areaUpload.addEventListener("drop", (evento) => {
    evento.preventDefault();
    areaUpload.classList.remove("arrastando");

    const arquivo = evento.dataTransfer.files[0];

    if (arquivo) {
        validarArquivo(arquivo);
    }
});

// ===== VALIDAÇÃO DO ARQUIVO =====

function validarArquivo(arquivo) {
    if (!FORMATOS_PERMITIDOS.includes(arquivo.type)) {
        alert("Selecione uma imagem JPEG, PNG ou WebP.");
        campoArquivo.value = "";
        return;
    }

    if (arquivo.size === 0) {
        alert("O arquivo selecionado está vazio.");
        campoArquivo.value = "";
        return;
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
        alert("O limite atual é de 20 MB por imagem.");
        campoArquivo.value = "";
        return;
    }

    carregarImagem(arquivo);
}

// ===== CARREGAMENTO DA IMAGEM =====

function carregarImagem(arquivo) {
    const novaUrl = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
        if (!imagem.naturalWidth || !imagem.naturalHeight) {
            URL.revokeObjectURL(novaUrl);
            alert("A imagem não possui dimensões válidas.");
            campoArquivo.value = "";
            return;
        }

        if (
            urlImagemAnterior &&
            urlImagemAnterior !== urlImagemAtual &&
            urlImagemAnterior !== urlImagemTrabalho
        ) {
            URL.revokeObjectURL(urlImagemAnterior);
        }

        imagemAnterior = null;
        urlImagemAnterior = null;

        if (urlImagemTrabalho && urlImagemTrabalho !== urlImagemAtual) {
            URL.revokeObjectURL(urlImagemTrabalho);
        }

        if (urlImagemAtual) {
            URL.revokeObjectURL(urlImagemAtual);
        }

        liberarResultadoAnterior();

        imagemAtual = arquivo;
        imagemTrabalho = imagem;
        urlImagemAtual = novaUrl;
        urlImagemTrabalho = novaUrl;

        mostrarPrevia(imagem, arquivo);
    };

    imagem.onerror = () => {
        URL.revokeObjectURL(novaUrl);
        alert("Não foi possível ler a imagem selecionada.");
        campoArquivo.value = "";
    };

    imagem.src = novaUrl;
}

// ===== PRÉ-VISUALIZAÇÃO E CONTROLES =====


function mostrarPrevia(imagem, arquivo) {
    const imagemBase = imagemTrabalho || imagem;
    const larguraOriginal = imagemBase.naturalWidth;
    const alturaOriginal = imagemBase.naturalHeight;

    areaUpload.innerHTML = `
        <h2>Área de trabalho</h2>

        <div
            id="area-trabalho-imagem"
            style="position:relative; display:inline-block; max-width:100%; line-height:0; touch-action:none;"
        >
            <img
                id="previa-imagem"
                alt="Imagem em edição"
                draggable="false"
                style="display:block; max-width:100%; max-height:600px; width:auto; height:auto; user-select:none;"
            >
            <div
                id="selecao-corte"
                style="position:absolute; display:none; border:2px solid #176b50; background:rgba(23,107,80,0.20); box-sizing:border-box; pointer-events:none;"
            ></div>
        </div>

        <div class="acoes-historico">
            <button type="button" id="desfazer-edicao" disabled>
                Desfazer última edição
            </button>
            <span id="estado-historico" aria-live="polite">
                Nenhuma edição para desfazer.
            </span>
        </div>

        <div class="informacoes-imagem">
            <p><strong>Arquivo:</strong> <span id="nome-imagem"></span></p>
            <p><strong>Tamanho original:</strong> <span id="tamanho-imagem"></span></p>
            <p><strong>Dimensões atuais:</strong> <span id="dimensoes-imagem"></span></p>
        </div>

        <div class="navegacao-ferramentas" role="group" aria-label="Ferramentas de imagem">
            <button type="button" class="aba-ferramenta ativa" data-painel="painel-comprimir">Exportar</button>
            <button type="button" class="aba-ferramenta" data-painel="painel-redimensionar">Redimensionar</button>
            <button type="button" class="aba-ferramenta" data-painel="painel-cortar">Cortar</button>
            <button type="button" class="aba-ferramenta" data-painel="painel-transformar">Girar e espelhar</button>
            <button type="button" class="aba-ferramenta" data-painel="painel-filtros">Filtros</button>
            <button type="button" class="aba-ferramenta" data-painel="painel-ajustes">Ajustes</button>
        </div>

        <section class="painel-ferramenta" id="painel-comprimir">
            <div class="controles-compressao">
                <h3>Exportar e comprimir</h3>
                <label for="qualidade-imagem">Qualidade: <strong id="valor-qualidade">80%</strong></label>
                <input type="range" id="qualidade-imagem" min="10" max="100" value="80" step="5">
                <label for="formato-saida">Formato de saída</label>
                <select id="formato-saida">
                    <option value="image/webp">WebP</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                </select>
                <button type="button" id="processar-imagem">Gerar imagem final</button>
            </div>
            <div id="resultado-compressao" aria-live="polite"></div>
        </section>

        <section class="painel-ferramenta" id="painel-redimensionar" hidden>
            <div class="controles-compressao">
                <h3>Redimensionar imagem</h3>
                <label for="largura-imagem">Largura (px)</label>
                <input type="number" id="largura-imagem" min="1" max="${DIMENSAO_MAXIMA}" step="1" value="${larguraOriginal}">
                <label for="altura-imagem">Altura (px)</label>
                <input type="number" id="altura-imagem" min="1" max="${DIMENSAO_MAXIMA}" step="1" value="${alturaOriginal}">
                <label><input type="checkbox" id="manter-proporcao" checked> Manter proporção</label>
                <p id="aviso-dimensoes" aria-live="polite"></p>
                <button type="button" id="redimensionar-imagem">Aplicar redimensionamento</button>
            </div>
            <div id="resultado-redimensionamento" aria-live="polite"></div>
        </section>

        <section class="painel-ferramenta" id="painel-cortar" hidden>
            <div class="controles-compressao">
                <h3>Cortar imagem</h3>
                <p>Arraste diretamente sobre a imagem acima para selecionar a região. Depois, clique em aplicar corte.</p>
                <p id="dimensoes-corte" aria-live="polite">Selecione uma região na imagem.</p>
                <button type="button" id="limpar-corte">Limpar seleção</button>
                <button type="button" id="aplicar-corte">Aplicar corte na imagem</button>
            </div>
            <div id="resultado-corte" aria-live="polite"></div>
        </section>

        <section class="painel-ferramenta" id="painel-transformar" hidden>
            <div class="controles-compressao">
                <h3>Girar e espelhar</h3>
                <p>As alterações são aplicadas à imagem central.</p>
                <button type="button" data-rotacao="90">Girar 90° à direita</button>
                <button type="button" data-rotacao="-90">Girar 90° à esquerda</button>
                <button type="button" data-rotacao="180">Girar 180°</button>
                <button type="button" data-espelho="horizontal">Espelhar horizontalmente</button>
                <button type="button" data-espelho="vertical">Espelhar verticalmente</button>
                <p id="resultado-transformacao" aria-live="polite"></p>
            </div>
        </section>

        <section class="painel-ferramenta" id="painel-filtros" hidden>
            <div class="controles-compressao">
                <h3>Filtros para redes sociais</h3>
                <p>Escolha um efeito para aplicar à imagem atual.</p>

                <div class="grade-filtros">
                    <button type="button" data-filtro-imagem="grayscale">Preto e branco</button>
                    <button type="button" data-filtro-imagem="sepia">Sépia</button>
                    <button type="button" data-filtro-imagem="saturate">Saturação</button>
                    <button type="button" data-filtro-imagem="golden">Golden</button>
                    <button type="button" data-filtro-imagem="cinematic">Cinemático</button>
                    <button type="button" data-filtro-imagem="pastel">Pastel</button>
                    <button type="button" data-filtro-imagem="vibrant">Vibrante</button>
                    <button type="button" data-filtro-imagem="vintage">Vintage fosco</button>
                </div>

                <p id="resultado-filtros" aria-live="polite"></p>
            </div>
        </section>

        <section class="painel-ferramenta" id="painel-ajustes" hidden>
            <div class="controles-compressao">
                <h3>Ajustes de imagem</h3>
                <p>Experimente os controles e aplique o resultado quando estiver satisfeito.</p>

                <label for="ajuste-brilho">Brilho: <strong id="valor-brilho">100%</strong></label>
                <input type="range" id="ajuste-brilho" min="50" max="150" value="100" step="1">

                <label for="ajuste-contraste">Contraste: <strong id="valor-contraste">100%</strong></label>
                <input type="range" id="ajuste-contraste" min="50" max="150" value="100" step="1">

                <label for="ajuste-saturacao">Saturação: <strong id="valor-saturacao">100%</strong></label>
                <input type="range" id="ajuste-saturacao" min="0" max="200" value="100" step="1">

                <label for="ajuste-temperatura">Temperatura: <strong id="valor-temperatura">0</strong></label>
                <input type="range" id="ajuste-temperatura" min="-30" max="30" value="0" step="1">

                <button type="button" id="aplicar-ajustes">Aplicar ajustes</button>
                <button type="button" id="restaurar-ajustes">Restaurar controles</button>
                <p id="resultado-ajustes" aria-live="polite"></p>
                <a id="baixar-ajustes" class="botao-download-edicao" hidden>Baixar imagem ajustada</a>
            </div>
        </section>

        <button type="button" id="trocar-imagem">Escolher outra imagem</button>
    `;

    const previa = document.getElementById("previa-imagem");
    previa.src = urlImagemTrabalho || urlImagemAtual;
    document.getElementById("nome-imagem").textContent = arquivo.name;
    document.getElementById("tamanho-imagem").textContent = formatarTamanho(arquivo.size);
    document.getElementById("dimensoes-imagem").textContent = `${larguraOriginal} × ${alturaOriginal} pixels`;

    document.querySelectorAll(".aba-ferramenta").forEach((aba) => {
        aba.addEventListener("click", () => {
            document.querySelectorAll(".aba-ferramenta").forEach((outraAba) => {
                outraAba.classList.toggle("ativa", outraAba === aba);
            });
            document.querySelectorAll(".painel-ferramenta").forEach((painel) => {
                painel.hidden = painel.id !== aba.dataset.painel;
            });
            if (aba.dataset.painel !== "painel-cortar") {
                const selecao = document.getElementById("selecao-corte");
                if (selecao) selecao.style.display = "none";
            }
        });
    });

    const controleQualidade = document.getElementById("qualidade-imagem");
    const valorQualidade = document.getElementById("valor-qualidade");
    controleQualidade.addEventListener("input", () => {
        valorQualidade.textContent = `${controleQualidade.value}%`;
    });

    document.getElementById("trocar-imagem").addEventListener("click", () => campoArquivo.click());

    document.getElementById("desfazer-edicao").addEventListener("click", desfazerUltimaEdicao);

    document.getElementById("processar-imagem").addEventListener("click", () => comprimirImagem(imagemTrabalho || imagem, arquivo));
    document.getElementById("redimensionar-imagem").addEventListener("click", () => redimensionarImagem(imagemTrabalho || imagem, arquivo));

    document.querySelectorAll("[data-rotacao]").forEach((botao) => {
        botao.addEventListener("click", () => {
            aplicarTransformacao("rotacao", Number(botao.dataset.rotacao));
        });
    });

    document.querySelectorAll("[data-espelho]").forEach((botao) => {
        botao.addEventListener("click", () => {
            aplicarTransformacao("espelho", botao.dataset.espelho);
        });
    });

    document.querySelectorAll("[data-filtro-imagem]").forEach((botao) => {
        botao.addEventListener("click", () => {
            aplicarFiltroImagem(botao.dataset.filtroImagem);
        });
    });

    configurarProporcao();
    configurarCorte(arquivo);

    const controlesAjustes = {
        brilho: document.getElementById("ajuste-brilho"),
        contraste: document.getElementById("ajuste-contraste"),
        saturacao: document.getElementById("ajuste-saturacao"),
        temperatura: document.getElementById("ajuste-temperatura")
    };

    const atualizarPreviaAjustes = () => {
        const brilho = Number(controlesAjustes.brilho.value);
        const contraste = Number(controlesAjustes.contraste.value);
        const saturacao = Number(controlesAjustes.saturacao.value);
        const temperatura = Number(controlesAjustes.temperatura.value);

        document.getElementById("valor-brilho").textContent = `${brilho}%`;
        document.getElementById("valor-contraste").textContent = `${contraste}%`;
        document.getElementById("valor-saturacao").textContent = `${saturacao}%`;
        document.getElementById("valor-temperatura").textContent =
            temperatura > 0 ? `+${temperatura}` : String(temperatura);

        const efeitoTemperatura = temperatura >= 0
            ? `sepia(${temperatura / 100})`
            : `hue-rotate(${temperatura * 0.35}deg)`;

        previa.style.filter =
            `brightness(${brilho}%) contrast(${contraste}%) ` +
            `saturate(${saturacao}%) ${efeitoTemperatura}`;
    };

    document.getElementById("aplicar-ajustes").addEventListener("click", () => {
        const base = imagemTrabalho || imagem;
        const resultado = document.getElementById("resultado-ajustes");
        const botao = document.getElementById("aplicar-ajustes");

        if (!base || !base.naturalWidth || !base.naturalHeight) {
            resultado.textContent = "Nenhuma imagem disponível para edição.";
            return;
        }

        const brilho = Number(controlesAjustes.brilho.value);
        const contraste = Number(controlesAjustes.contraste.value);
        const saturacao = Number(controlesAjustes.saturacao.value);
        const temperatura = Number(controlesAjustes.temperatura.value);

        const efeitoTemperatura = temperatura >= 0
            ? `sepia(${temperatura / 100})`
            : `hue-rotate(${temperatura * 0.35}deg)`;

        const canvas = document.createElement("canvas");
        canvas.width = base.naturalWidth;
        canvas.height = base.naturalHeight;

        const contexto = canvas.getContext("2d");
        if (!contexto) {
            resultado.textContent = "Não foi possível iniciar os ajustes.";
            return;
        }

        contexto.drawImage(base, 0, 0);
        botao.disabled = true;
        resultado.textContent = "Aplicando ajustes aos pixels da imagem...";

        try {
            const imagemDados = contexto.getImageData(
                0, 0, canvas.width, canvas.height
            );
            const pixels = imagemDados.data;
            const fatorContraste = contraste / 100;
            const fatorSaturacao = saturacao / 100;
            const fatorBrilho = brilho / 100;
            const deslocamentoTemperatura = temperatura * 0.8;

            for (let i = 0; i < pixels.length; i += 4) {
                let r = pixels[i] * fatorBrilho;
                let g = pixels[i + 1] * fatorBrilho;
                let b = pixels[i + 2] * fatorBrilho;

                r = (r - 128) * fatorContraste + 128;
                g = (g - 128) * fatorContraste + 128;
                b = (b - 128) * fatorContraste + 128;

                const luminosidade = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                r = luminosidade + (r - luminosidade) * fatorSaturacao;
                g = luminosidade + (g - luminosidade) * fatorSaturacao;
                b = luminosidade + (b - luminosidade) * fatorSaturacao;

                r += deslocamentoTemperatura;
                g += deslocamentoTemperatura * 0.12;
                b -= deslocamentoTemperatura;

                pixels[i] = Math.max(0, Math.min(255, Math.round(r)));
                pixels[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
                pixels[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
            }

            contexto.putImageData(imagemDados, 0, 0);
        } catch (erro) {
            botao.disabled = false;
            resultado.textContent =
                "Não foi possível processar esta imagem. Tente uma imagem menor.";
            console.error("Erro ao aplicar ajustes:", erro);
            return;
        }

        canvas.toBlob((blob) => {
            botao.disabled = false;

            if (!blob) {
                resultado.textContent = "Não foi possível gerar a imagem ajustada.";
                return;
            }

            previa.style.filter = "none";
            atualizarImagemTrabalho(blob, "Ajustes aplicados", resultado);
        }, "image/png");
    });

    Object.values(controlesAjustes).forEach((controle) => {
        controle.addEventListener("input", atualizarPreviaAjustes);
    });

    document.getElementById("restaurar-ajustes").addEventListener("click", () => {
        controlesAjustes.brilho.value = 100;
        controlesAjustes.contraste.value = 100;
        controlesAjustes.saturacao.value = 100;
        controlesAjustes.temperatura.value = 0;
        atualizarPreviaAjustes();
        document.getElementById("resultado-ajustes").textContent =
            "Controles restaurados. A imagem original desta edição foi preservada.";
    });
}

// ===== MANTER PROPORÇÃO =====


 // ===== FERRAMENTA DE CORTE =====

function configurarCorte(arquivo) {
    const area = document.getElementById("area-trabalho-imagem");
    const imagemCorte = document.getElementById("previa-imagem");
    const selecao = document.getElementById("selecao-corte");
    const dimensoes = document.getElementById("dimensoes-corte");
    const botaoLimpar = document.getElementById("limpar-corte");
    const botaoAplicar = document.getElementById("aplicar-corte");
    const resultado = document.getElementById("resultado-corte");

    let arrastando = false;
    let inicioX = 0;
    let inicioY = 0;
    let regiao = null;

    function limitar(valor, minimo, maximo) {
        return Math.max(minimo, Math.min(valor, maximo));
    }

    function obterPosicao(evento) {
        const retangulo = imagemCorte.getBoundingClientRect();
        return {
            x: limitar(evento.clientX - retangulo.left, 0, retangulo.width),
            y: limitar(evento.clientY - retangulo.top, 0, retangulo.height)
        };
    }

    function desenharSelecao(x1, y1, x2, y2) {
        const esquerda = Math.min(x1, x2);
        const topo = Math.min(y1, y2);
        const largura = Math.abs(x2 - x1);
        const altura = Math.abs(y2 - y1);

        selecao.style.left = `${esquerda}px`;
        selecao.style.top = `${topo}px`;
        selecao.style.width = `${largura}px`;
        selecao.style.height = `${altura}px`;
        regiao = { x: esquerda, y: topo, largura, altura };

        if (largura > 2 && altura > 2) {
            const larguraReal = Math.round(largura * imagemCorte.naturalWidth / imagemCorte.clientWidth);
            const alturaReal = Math.round(altura * imagemCorte.naturalHeight / imagemCorte.clientHeight);
            dimensoes.textContent = `Área selecionada: ${larguraReal} × ${alturaReal} pixels`;
        } else {
            dimensoes.textContent = "Selecione uma região maior.";
        }
    }

    area.addEventListener("pointerdown", (evento) => {
        if (document.getElementById("painel-cortar").hidden) return;
        if (evento.target !== imagemCorte && evento.target !== selecao) return;
        evento.preventDefault();
        const posicao = obterPosicao(evento);
        arrastando = true;
        inicioX = posicao.x;
        inicioY = posicao.y;
        regiao = null;
        resultado.textContent = "";
        selecao.style.display = "block";
        desenharSelecao(inicioX, inicioY, inicioX, inicioY);
        area.setPointerCapture(evento.pointerId);
    });

    area.addEventListener("pointermove", (evento) => {
        if (!arrastando) return;
        const posicao = obterPosicao(evento);
        desenharSelecao(inicioX, inicioY, posicao.x, posicao.y);
    });

    function finalizarSelecao() { arrastando = false; }
    area.addEventListener("pointerup", finalizarSelecao);
    area.addEventListener("pointercancel", finalizarSelecao);

    botaoLimpar.addEventListener("click", () => {
        regiao = null;
        selecao.style.display = "none";
        dimensoes.textContent = "Selecione uma região na imagem.";
        resultado.textContent = "";
    });

    botaoAplicar.addEventListener("click", () => {
        if (!regiao || regiao.largura < 3 || regiao.altura < 3) {
            resultado.textContent = "Selecione uma área da imagem antes de cortar.";
            return;
        }

        const larguraExibida = imagemCorte.clientWidth;
        const alturaExibida = imagemCorte.clientHeight;
        const largura = Math.max(1, Math.round(regiao.largura * imagemCorte.naturalWidth / larguraExibida));
        const altura = Math.max(1, Math.round(regiao.altura * imagemCorte.naturalHeight / alturaExibida));
        const x = Math.round(regiao.x * imagemCorte.naturalWidth / larguraExibida);
        const y = Math.round(regiao.y * imagemCorte.naturalHeight / alturaExibida);

        if (largura * altura > PIXELS_MAXIMOS) {
            resultado.textContent = "A região selecionada é grande demais para processar.";
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;
        const contexto = canvas.getContext("2d");
        if (!contexto) {
            resultado.textContent = "Não foi possível iniciar o corte.";
            return;
        }

        contexto.drawImage(imagemTrabalho || imagemCorte, x, y, largura, altura, 0, 0, largura, altura);
        botaoAplicar.disabled = true;
        resultado.textContent = "Aplicando corte à área de trabalho...";

        canvas.toBlob((blob) => {
            botaoAplicar.disabled = false;
            if (!blob) {
                resultado.textContent = "Não foi possível aplicar o corte.";
                return;
            }
            atualizarImagemTrabalho(blob, "Corte aplicado", resultado);
            regiao = null;
            selecao.style.display = "none";
            dimensoes.textContent = `Imagem cortada: ${largura} × ${altura} pixels.`;
        }, "image/png");
    });
}

function configurarProporcao() {
    const campoLargura = document.getElementById("largura-imagem");
    const campoAltura = document.getElementById("altura-imagem");
    const manterProporcao = document.getElementById("manter-proporcao");
    let ultimaDimensaoAlterada = "largura";

    function dimensoesBase() {
        const base = imagemTrabalho || document.getElementById("previa-imagem");
        return { largura: base.naturalWidth, altura: base.naturalHeight };
    }

    campoLargura.addEventListener("input", () => {
        ultimaDimensaoAlterada = "largura";
        if (!manterProporcao.checked) return;
        const { largura, altura } = dimensoesBase();
        const valor = Number(campoLargura.value);
        if (valor > 0 && Number.isFinite(valor)) campoAltura.value = Math.round(valor * altura / largura);
    });

    campoAltura.addEventListener("input", () => {
        ultimaDimensaoAlterada = "altura";
        if (!manterProporcao.checked) return;
        const { largura, altura } = dimensoesBase();
        const valor = Number(campoAltura.value);
        if (valor > 0 && Number.isFinite(valor)) campoLargura.value = Math.round(valor * largura / altura);
    });

    manterProporcao.addEventListener("change", () => {
        if (!manterProporcao.checked) return;
        const { largura, altura } = dimensoesBase();
        if (ultimaDimensaoAlterada === "largura") {
            campoAltura.value = Math.round(Number(campoLargura.value) * altura / largura);
        } else {
            campoLargura.value = Math.round(Number(campoAltura.value) * largura / altura);
        }
    });
}

// ===== COMPRESSÃO E CONVERSÃO =====

function comprimirImagem(imagem, arquivo) {
    const base = imagemTrabalho || imagem;
    const formato = document.getElementById("formato-saida").value;
    const qualidade = Number(document.getElementById("qualidade-imagem").value) / 100;
    const resultado = document.getElementById("resultado-compressao");
    const botao = document.getElementById("processar-imagem");

    botao.disabled = true;
    resultado.textContent = "Gerando arquivo final da imagem editada...";
    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");
    if (!contexto) {
        resultado.textContent = "Não foi possível iniciar o processamento.";
        botao.disabled = false;
        return;
    }

    canvas.width = base.naturalWidth;
    canvas.height = base.naturalHeight;
    prepararFundo(contexto, formato, canvas.width, canvas.height);
    contexto.drawImage(base, 0, 0);

    canvas.toBlob((blob) => {
        botao.disabled = false;
        if (!blob) {
            resultado.textContent = "Não foi possível gerar o arquivo final.";
            return;
        }
        if (blob.type !== formato) {
            resultado.textContent = "O navegador não conseguiu gerar esse formato. Tente JPEG ou WebP.";
            return;
        }
        liberarUrl("compressao");
        urlResultadoAtual = URL.createObjectURL(blob);
        mostrarResultado(resultado, arquivo, blob, urlResultadoAtual, "editada");
    }, formato, formato === "image/png" ? undefined : qualidade);
}

// ===== REDIMENSIONAMENTO =====

function redimensionarImagem(imagem, arquivo) {
    const base = imagemTrabalho || imagem;
    const campoLargura = document.getElementById("largura-imagem");
    const campoAltura = document.getElementById("altura-imagem");
    const resultado = document.getElementById("resultado-redimensionamento");
    const botao = document.getElementById("redimensionar-imagem");
    const largura = Number(campoLargura.value);
    const altura = Number(campoAltura.value);

    if (!Number.isInteger(largura) || !Number.isInteger(altura) || largura < 1 || altura < 1 || largura > DIMENSAO_MAXIMA || altura > DIMENSAO_MAXIMA) {
        resultado.textContent = `Informe largura e altura inteiras entre 1 e ${DIMENSAO_MAXIMA} pixels.`;
        return;
    }
    if (largura * altura > PIXELS_MAXIMOS) {
        resultado.textContent = "Essas dimensões são grandes demais para o processamento. Reduza a largura ou a altura.";
        return;
    }
    if (largura === base.naturalWidth && altura === base.naturalHeight) {
        resultado.textContent = "A imagem já possui essas dimensões.";
        return;
    }

    botao.disabled = true;
    resultado.textContent = "Aplicando redimensionamento à área de trabalho...";
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext("2d");
    if (!contexto) {
        resultado.textContent = "Não foi possível iniciar o redimensionamento.";
        botao.disabled = false;
        return;
    }

    contexto.drawImage(base, 0, 0, largura, altura);
    canvas.toBlob((blob) => {
        botao.disabled = false;
        if (!blob) {
            resultado.textContent = "Não foi possível redimensionar a imagem.";
            return;
        }
        atualizarImagemTrabalho(blob, `Redimensionamento aplicado: ${largura} × ${altura} pixels`, resultado);
    }, "image/png");
}

// Atualiza a imagem central após corte ou redimensionamento.
function atualizarImagemTrabalho(blob, mensagem, resultado) {
    const novaUrl = URL.createObjectURL(blob);
    const novaImagem = new Image();

    novaImagem.onload = () => {
        const urlHistoricoAntigo = urlImagemAnterior;
        const urlAnterior = urlImagemTrabalho;

        imagemAnterior = imagemTrabalho;
        urlImagemAnterior = urlAnterior;

        imagemTrabalho = novaImagem;
        urlImagemTrabalho = novaUrl;

        const botaoDesfazer = document.getElementById("desfazer-edicao");
        const estadoHistorico = document.getElementById("estado-historico");

        if (botaoDesfazer) botaoDesfazer.disabled = false;
        if (estadoHistorico) estadoHistorico.textContent = "Uma edição pode ser desfeita.";

        const previa = document.getElementById("previa-imagem");
        previa.src = novaUrl;
        document.getElementById("dimensoes-imagem").textContent =
            `${novaImagem.naturalWidth} × ${novaImagem.naturalHeight} pixels`;
        document.getElementById("largura-imagem").value = novaImagem.naturalWidth;
        document.getElementById("altura-imagem").value = novaImagem.naturalHeight;

        const selecao = document.getElementById("selecao-corte");
        if (selecao) selecao.style.display = "none";

        if (
            urlHistoricoAntigo &&
            urlHistoricoAntigo !== urlImagemAtual &&
            urlHistoricoAntigo !== urlAnterior
        ) {
            URL.revokeObjectURL(urlHistoricoAntigo);
        }

        if (resultado) {
            resultado.replaceChildren();

            const texto = document.createElement("p");
            texto.textContent =
                `${mensagem}. A imagem atualizada está visível na área de trabalho.`;
            resultado.appendChild(texto);

            const link = document.createElement("a");
            const urlDownload = URL.createObjectURL(blob);
            const extensoes = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            };
            const extensao = extensoes[blob.type] || "png";

            if (resultado.dataset.urlDownload) {
                URL.revokeObjectURL(resultado.dataset.urlDownload);
            }

            resultado.dataset.urlDownload = urlDownload;
            link.href = urlDownload;
            link.download = `imagelab-editada.${extensao}`;
            link.textContent = "Baixar imagem editada";
            link.className = "botao-download-edicao";
            if (resultado.id !== "resultado-ajustes") {
                resultado.appendChild(link);
            }

            if (resultado.id === "resultado-ajustes") {
                const baixarAjustes = document.getElementById("baixar-ajustes");

                if (baixarAjustes) {
                    if (baixarAjustes.dataset.urlDownload) {
                        URL.revokeObjectURL(baixarAjustes.dataset.urlDownload);
                    }

                    const urlAjustes = URL.createObjectURL(blob);
                    baixarAjustes.href = urlAjustes;
                    baixarAjustes.download = `imagelab-ajustada.${extensao}`;
                    baixarAjustes.dataset.urlDownload = urlAjustes;
                    baixarAjustes.hidden = false;
                }
            }
        }
    };

    novaImagem.onerror = () => {
        URL.revokeObjectURL(novaUrl);
        if (resultado) {
            resultado.textContent =
                "A edição foi gerada, mas não foi possível atualizar a pré-visualização.";
        }
    };

    novaImagem.src = novaUrl;
}

// Restaura a imagem anterior à última edição aplicada.
function desfazerUltimaEdicao() {
    if (!imagemAnterior || !urlImagemAnterior) {
        return;
    }

    const urlAtual = urlImagemTrabalho;

    imagemTrabalho = imagemAnterior;
    urlImagemTrabalho = urlImagemAnterior;
    imagemAnterior = null;
    urlImagemAnterior = null;

    const previa = document.getElementById("previa-imagem");
    previa.src = urlImagemTrabalho;
    previa.style.filter = "none";

    document.getElementById("dimensoes-imagem").textContent =
        `${imagemTrabalho.naturalWidth} × ${imagemTrabalho.naturalHeight} pixels`;
    document.getElementById("largura-imagem").value =
        imagemTrabalho.naturalWidth;
    document.getElementById("altura-imagem").value =
        imagemTrabalho.naturalHeight;

    const selecao = document.getElementById("selecao-corte");
    if (selecao) selecao.style.display = "none";

    const botaoDesfazer = document.getElementById("desfazer-edicao");
    const estadoHistorico = document.getElementById("estado-historico");

    if (botaoDesfazer) botaoDesfazer.disabled = true;
    if (estadoHistorico) estadoHistorico.textContent = "Última edição desfeita.";

    window.imagemBaseFiltros = null;

    if (urlAtual && urlAtual !== urlImagemAtual && urlAtual !== urlImagemTrabalho) {
        URL.revokeObjectURL(urlAtual);
    }
}

// ===== ROTAÇÃO E ESPELHAMENTO =====

function aplicarTransformacao(tipo, valor) {
    const base = imagemTrabalho || document.getElementById("previa-imagem");
    const resultado = document.getElementById("resultado-transformacao");

    if (!base || !base.naturalWidth || !base.naturalHeight) {
        resultado.textContent = "Nenhuma imagem disponível para edição.";
        return;
    }

    const larguraOriginal = base.naturalWidth;
    const alturaOriginal = base.naturalHeight;
    const angulo = tipo === "rotacao" ? Number(valor) : 0;
    const giraDeLado = Math.abs(angulo) % 180 === 90;
    const largura = giraDeLado ? alturaOriginal : larguraOriginal;
    const altura = giraDeLado ? larguraOriginal : alturaOriginal;

    if (largura * altura > PIXELS_MAXIMOS) {
        resultado.textContent = "A imagem é grande demais para essa transformação.";
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
        resultado.textContent = "Não foi possível iniciar a transformação.";
        return;
    }

    contexto.translate(largura / 2, altura / 2);

    if (tipo === "rotacao") {
        contexto.rotate(angulo * Math.PI / 180);
    } else if (valor === "horizontal") {
        contexto.scale(-1, 1);
    } else if (valor === "vertical") {
        contexto.scale(1, -1);
    }

    contexto.drawImage(
        base,
        -larguraOriginal / 2,
        -alturaOriginal / 2
    );

    resultado.textContent = "Aplicando transformação...";

    canvas.toBlob((blob) => {
        if (!blob) {
            resultado.textContent = "Não foi possível aplicar a transformação.";
            return;
        }

        const mensagem = tipo === "rotacao"
            ? `Rotação de ${valor}° aplicada`
            : valor === "horizontal"
                ? "Espelhamento horizontal aplicado"
                : "Espelhamento vertical aplicado";

        atualizarImagemTrabalho(blob, mensagem, resultado);
    }, "image/png");
}

// ===== FILTROS PARA REDES SOCIAIS =====

function aplicarFiltroImagem(nomeFiltro) {
    const resultado = document.getElementById("resultado-filtros");
    const baseAtual = imagemTrabalho || document.getElementById("previa-imagem");

    if (!baseAtual || !baseAtual.naturalWidth || !baseAtual.naturalHeight) {
        resultado.textContent = "Nenhuma imagem disponível para edição.";
        return;
    }

    // A base fica estável enquanto o usuário experimenta filtros.
    // Um novo filtro substitui o anterior, em vez de acumular efeitos.
    if (!window.imagemBaseFiltros ||
        window.imagemBaseFiltros.width !== baseAtual.naturalWidth ||
        window.imagemBaseFiltros.height !== baseAtual.naturalHeight) {
        const baseCanvas = document.createElement("canvas");
        baseCanvas.width = baseAtual.naturalWidth;
        baseCanvas.height = baseAtual.naturalHeight;
        const baseContexto = baseCanvas.getContext("2d");

        if (!baseContexto) {
            resultado.textContent = "Não foi possível preparar a imagem.";
            return;
        }

        baseContexto.drawImage(baseAtual, 0, 0);
        window.imagemBaseFiltros = baseCanvas;
    }

    const filtros = {
        grayscale: {
            css: "grayscale(1)",
            nome: "Preto e branco"
        },
        sepia: {
            css: "sepia(0.42) saturate(0.92) contrast(1.02)",
            nome: "Sépia"
        },
        saturate: {
            css: "saturate(1.15)",
            nome: "Saturação suave"
        },
        golden: {
            css: "sepia(0.16) saturate(1.08) brightness(1.015)",
            nome: "Golden"
        },
        cinematic: {
            css: "contrast(1.08) saturate(1.06)",
            nome: "Cinemático"
        },
        pastel: {
            css: "saturate(0.88) brightness(1.025) contrast(0.94)",
            nome: "Pastel"
        },
        vibrant: {
            css: "saturate(1.22) contrast(1.035)",
            nome: "Vibrante"
        },
        vintage: {
            css: "sepia(0.18) saturate(0.90) contrast(0.94) brightness(1.015)",
            nome: "Vintage fosco"
        }
    };

    const filtro = filtros[nomeFiltro];
    if (!filtro) {
        resultado.textContent = "Filtro não reconhecido.";
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = window.imagemBaseFiltros.width;
    canvas.height = window.imagemBaseFiltros.height;

    const contexto = canvas.getContext("2d");
    if (!contexto) {
        resultado.textContent = "Não foi possível iniciar o filtro.";
        return;
    }

    contexto.filter = filtro.css;
    contexto.drawImage(window.imagemBaseFiltros, 0, 0);
    resultado.textContent = `Aplicando filtro ${filtro.nome}...`;

    canvas.toBlob((blob) => {
        if (!blob) {
            resultado.textContent = "Não foi possível gerar a imagem filtrada.";
            return;
        }

        atualizarImagemTrabalho(blob, `Filtro ${filtro.nome} aplicado`, resultado);
    }, "image/png");
}

// ===== FUNDO PARA FORMATOS SEM TRANSPARÊNCIA =====

function prepararFundo(contexto, formato, largura, altura) {
    if (formato === "image/jpeg") {
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, largura, altura);
    }
}

// ===== RESULTADO E DOWNLOAD =====

function mostrarResultado(resultado, arquivo, blob, url, sufixo) {
    const diferenca = arquivo.size - blob.size;
    const percentual = (diferenca / arquivo.size) * 100;

    let mensagem;

    if (diferenca > 0) {
        mensagem = `Redução de ${percentual.toFixed(1)}%`;
    } else if (diferenca < 0) {
        mensagem = `O arquivo ficou ${Math.abs(percentual).toFixed(1)}% maior`;
    } else {
        mensagem = "O tamanho do arquivo permaneceu igual.";
    }

    const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const extensao = extensoes[blob.type];
    const nomeBase = arquivo.name.replace(/\.[^.]+$/, "");
    const nomeDownload = `${nomeBase}-${sufixo}.${extensao}`;

    resultado.innerHTML = `
        <h3>Resultado</h3>

        <p>
            <strong>Tamanho original:</strong>
            ${formatarTamanho(arquivo.size)}
        </p>

        <p>
            <strong>Tamanho final:</strong>
            ${formatarTamanho(blob.size)}
        </p>

        <p>${mensagem}</p>

        <a class="botao-download-edicao"
           href="${url}" download="${nomeDownload}">
            Baixar imagem ${sufixo}
        </a>
    `;
}

// ===== FORMATAÇÃO DE TAMANHO =====

function formatarTamanho(bytes) {
    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ===== LIBERAÇÃO DE RECURSOS =====

function liberarUrl(tipo) {
    if (tipo === "compressao" && urlResultadoAtual) {
        URL.revokeObjectURL(urlResultadoAtual);
        urlResultadoAtual = null;
    }

    if (tipo === "redimensionamento" && urlRedimensionadaAtual) {
        URL.revokeObjectURL(urlRedimensionadaAtual);
        urlRedimensionadaAtual = null;
    }
}

function liberarResultadoAnterior() {
    liberarUrl("compressao");
    liberarUrl("redimensionamento");
}

window.addEventListener("pagehide", () => {
    if (urlImagemTrabalho && urlImagemTrabalho !== urlImagemAtual) {
        URL.revokeObjectURL(urlImagemTrabalho);
    }
    if (urlImagemAtual) {
        URL.revokeObjectURL(urlImagemAtual);
        urlImagemAtual = null;
    }
    urlImagemTrabalho = null;
    liberarResultadoAnterior();
    imagemAtual = null;
    imagemTrabalho = null;
});
