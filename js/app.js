
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
let urlImagemAtual = null;
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

        if (urlImagemAtual) {
            URL.revokeObjectURL(urlImagemAtual);
        }

        liberarResultadoAnterior();

        imagemAtual = arquivo;
        urlImagemAtual = novaUrl;

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
    const larguraOriginal = imagem.naturalWidth;
    const alturaOriginal = imagem.naturalHeight;

    areaUpload.innerHTML = `
        <h2>Imagem selecionada</h2>

        <img
            id="previa-imagem"
            alt="Pré-visualização da imagem selecionada"
        >

        <div class="informacoes-imagem">
            <p>
                <strong>Arquivo:</strong>
                <span id="nome-imagem"></span>
            </p>

            <p>
                <strong>Tamanho original:</strong>
                <span id="tamanho-imagem"></span>
            </p>

            <p>
                <strong>Dimensões:</strong>
                <span id="dimensoes-imagem"></span>
            </p>
        </div>

        <div class="controles-compressao">
            <h3>Comprimir ou converter</h3>

            <label for="qualidade-imagem">
                Qualidade:
                <strong id="valor-qualidade">80%</strong>
            </label>

            <input
                type="range"
                id="qualidade-imagem"
                min="10"
                max="100"
                value="80"
                step="5"
            >

            <label for="formato-saida">Formato de saída</label>

            <select id="formato-saida">
                <option value="image/webp">WebP</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
            </select>

            <button type="button" id="processar-imagem">
                Comprimir imagem
            </button>
        </div>

        <div id="resultado-compressao" aria-live="polite"></div>

        <div class="controles-compressao">
            <h3>Redimensionar imagem</h3>

            <p>
                Defina as novas dimensões em pixels.
            </p>

            <label for="largura-imagem">Largura (px)</label>

            <input
                type="number"
                id="largura-imagem"
                min="1"
                max="${DIMENSAO_MAXIMA}"
                step="1"
                value="${larguraOriginal}"
            >

            <label for="altura-imagem">Altura (px)</label>

            <input
                type="number"
                id="altura-imagem"
                min="1"
                max="${DIMENSAO_MAXIMA}"
                step="1"
                value="${alturaOriginal}"
            >

            <label>
                <input
                    type="checkbox"
                    id="manter-proporcao"
                    checked
                >
                Manter proporção original
            </label>

            <p id="aviso-dimensoes" aria-live="polite"></p>

            <button type="button" id="redimensionar-imagem">
                Redimensionar imagem
            </button>
        </div>

        <div id="resultado-redimensionamento" aria-live="polite"></div>

        
        <div class="controles-compressao">
            <h3>Cortar imagem</h3>

            <p>
                Arraste o mouse sobre a imagem para selecionar
                a área que deseja manter.
            </p>

            <div id="area-corte">
                <img
                    id="imagem-corte"
                    alt="Imagem para selecionar a área de corte"
                    draggable="false"
                >
                <div id="selecao-corte"></div>
            </div>

            <p id="dimensoes-corte" aria-live="polite">
                Arraste para selecionar uma região.
            </p>

            <button type="button" id="limpar-corte">
                Limpar seleção
            </button>

            <button type="button" id="aplicar-corte">
                Cortar e preparar download
            </button>
        </div>

        <div id="resultado-corte" aria-live="polite"></div>

        <button type="button" id="trocar-imagem">
            Escolher outra imagem
        </button>



    `;

    document.getElementById("previa-imagem").src = urlImagemAtual;

    document.getElementById("nome-imagem").textContent = arquivo.name;

    document.getElementById("tamanho-imagem").textContent =
        formatarTamanho(arquivo.size);

    document.getElementById("dimensoes-imagem").textContent =
        `${larguraOriginal} × ${alturaOriginal} pixels`;

    const controleQualidade =
        document.getElementById("qualidade-imagem");

    const valorQualidade =
        document.getElementById("valor-qualidade");

    controleQualidade.addEventListener("input", () => {
        valorQualidade.textContent = `${controleQualidade.value}%`;
    });

    document.getElementById("trocar-imagem").addEventListener("click", () => {
        campoArquivo.click();
    });

    document.getElementById("processar-imagem").addEventListener("click", () => {
        comprimirImagem(imagem, arquivo);
    });

    configurarProporcao(larguraOriginal, alturaOriginal);

    document
        .getElementById("redimensionar-imagem")
	        .addEventListener("click", () => {
            redimensionarImagem(imagem, arquivo);
        });

    configurarCorte(imagem, arquivo);
}


// ===== MANTER PROPORÇÃO =====


 // ===== FERRAMENTA DE CORTE =====

function configurarCorte(imagem, arquivo) {
    const area = document.getElementById("area-corte");
    const imagemCorte = document.getElementById("imagem-corte");
    const selecao = document.getElementById("selecao-corte");
    const dimensoes = document.getElementById("dimensoes-corte");
    const botaoLimpar = document.getElementById("limpar-corte");
    const botaoAplicar = document.getElementById("aplicar-corte");
    const resultado = document.getElementById("resultado-corte");

    imagemCorte.src = urlImagemAtual;

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
            y: limitar(evento.clientY - retangulo.top, 0, retangulo.height),
            larguraExibida: retangulo.width,
            alturaExibida: retangulo.height
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

        regiao = {
            x: esquerda,
            y: topo,
            largura,
            altura,
            larguraExibida: imagemCorte.clientWidth,
            alturaExibida: imagemCorte.clientHeight
        };

        if (largura > 2 && altura > 2) {
            const larguraReal = Math.round(
                largura * imagem.naturalWidth / imagemCorte.clientWidth
            );

            const alturaReal = Math.round(
                altura * imagem.naturalHeight / imagemCorte.clientHeight
            );

            dimensoes.textContent =
                `Área selecionada: ${larguraReal} × ${alturaReal} pixels`;
        } else {
            dimensoes.textContent = "Selecione uma região maior.";
        }
    }

    area.addEventListener("pointerdown", (evento) => {
        if (evento.target !== imagemCorte && evento.target !== selecao) {
            return;
        }

        evento.preventDefault();

        const posicao = obterPosicao(evento);

        arrastando = true;
        inicioX = posicao.x;
        inicioY = posicao.y;

        regiao = null;
        resultado.replaceChildren();

        selecao.style.display = "block";
        desenharSelecao(inicioX, inicioY, inicioX, inicioY);

        area.setPointerCapture(evento.pointerId);
    });

    area.addEventListener("pointermove", (evento) => {
        if (!arrastando) {
            return;
        }

        const posicao = obterPosicao(evento);

        desenharSelecao(
            inicioX,
            inicioY,
            posicao.x,
            posicao.y
        );
    });

    function finalizarSelecao() {
        arrastando = false;
    }

    area.addEventListener("pointerup", finalizarSelecao);
    area.addEventListener("pointercancel", finalizarSelecao);

    botaoLimpar.addEventListener("click", () => {
        regiao = null;
        selecao.style.display = "none";
        dimensoes.textContent = "Arraste para selecionar uma região.";
        resultado.replaceChildren();
    });

    botaoAplicar.addEventListener("click", () => {
        if (!regiao || regiao.largura < 3 || regiao.altura < 3) {
            resultado.textContent =
                "Selecione uma área da imagem antes de cortar.";
            return;
        }

        const escalaX = imagem.naturalWidth / imagemCorte.clientWidth;
        const escalaY = imagem.naturalHeight / imagemCorte.clientHeight;

        const x = Math.round(regiao.x * escalaX);
        const y = Math.round(regiao.y * escalaY);
        const largura = Math.round(regiao.largura * escalaX);
        const altura = Math.round(regiao.altura * escalaY);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const contexto = canvas.getContext("2d");

        if (!contexto) {
            resultado.textContent = "Não foi possível iniciar o corte.";
            return;
        }

        const formato = document.getElementById("formato-saida").value;
        const qualidade =
            Number(document.getElementById("qualidade-imagem").value) / 100;

        if (formato === "image/jpeg") {
            contexto.fillStyle = "#ffffff";
            contexto.fillRect(0, 0, largura, altura);
        }

        contexto.drawImage(
            imagem,
            x, y, largura, altura,
            0, 0, largura, altura
        );

        botaoAplicar.disabled = true;
        resultado.textContent = "Gerando recorte...";

        canvas.toBlob((blob) => {
            botaoAplicar.disabled = false;

            if (!blob || blob.type !== formato) {
                resultado.textContent =
                    "Não foi possível gerar o recorte nesse formato.";
                return;
            }

            if (urlCortadaAtual) {
                URL.revokeObjectURL(urlCortadaAtual);
            }

            urlCortadaAtual = URL.createObjectURL(blob);

            const extensoes = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            };

            const nomeBase = arquivo.name.replace(/\.[^.]+$/, "");
            const nome = `${nomeBase}-recortada.${extensoes[blob.type]}`;

            resultado.innerHTML = `
                <h3>Imagem recortada</h3>
                <p>Dimensões: ${largura} × ${altura} pixels</p>
                <p>Tamanho: ${formatarTamanho(blob.size)}</p>
                <a id="baixar-corte" download="${nome}">Baixar imagem recortada</a>
            `;

            const link = document.getElementById("baixar-corte");
            link.href = urlCortadaAtual;
        }, formato, formato === "image/png" ? undefined : qualidade);
    });
}

function configurarProporcao(larguraOriginal, alturaOriginal) {
    const campoLargura = document.getElementById("largura-imagem");
    const campoAltura = document.getElementById("altura-imagem");
    const manterProporcao = document.getElementById("manter-proporcao");

    let ultimaDimensaoAlterada = "largura";

    campoLargura.addEventListener("input", () => {
        ultimaDimensaoAlterada = "largura";

        if (!manterProporcao.checked) {
            return;
        }

        const largura = Number(campoLargura.value);

        if (largura > 0 && Number.isFinite(largura)) {
            campoAltura.value = Math.round(
                largura * alturaOriginal / larguraOriginal
            );
        }
    });

    campoAltura.addEventListener("input", () => {
        ultimaDimensaoAlterada = "altura";

        if (!manterProporcao.checked) {
            return;
        }

        const altura = Number(campoAltura.value);

        if (altura > 0 && Number.isFinite(altura)) {
            campoLargura.value = Math.round(
                altura * larguraOriginal / alturaOriginal
            );
        }
    });

    manterProporcao.addEventListener("change", () => {
        if (!manterProporcao.checked) {
            return;
        }

        if (ultimaDimensaoAlterada === "largura") {
            campoAltura.value = Math.round(
                Number(campoLargura.value) *
                alturaOriginal / larguraOriginal
            );
        } else {
            campoLargura.value = Math.round(
                Number(campoAltura.value) *
                larguraOriginal / alturaOriginal
            );
        }
    });
}

// ===== COMPRESSÃO E CONVERSÃO =====

function comprimirImagem(imagem, arquivo) {
    const formato = document.getElementById("formato-saida").value;
    const qualidade =
        Number(document.getElementById("qualidade-imagem").value) / 100;

    const resultado = document.getElementById("resultado-compressao");
    const botao = document.getElementById("processar-imagem");

    botao.disabled = true;
    resultado.textContent = "Processando imagem...";

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");

    if (!contexto) {
        resultado.textContent = "Não foi possível iniciar o processamento.";
        botao.disabled = false;
        return;
    }

    canvas.width = imagem.naturalWidth;
    canvas.height = imagem.naturalHeight;

    prepararFundo(contexto, formato, canvas.width, canvas.height);
    contexto.drawImage(imagem, 0, 0);

    canvas.toBlob((blob) => {
        botao.disabled = false;

        if (!blob) {
            resultado.textContent = "Não foi possível gerar o arquivo final.";
            return;
        }

        if (blob.type !== formato) {
            resultado.textContent =
                "O navegador não conseguiu gerar esse formato. " +
                "Tente JPEG ou WebP.";
            return;
        }

        liberarUrl("compressao");

        urlResultadoAtual = URL.createObjectURL(blob);

        mostrarResultado(
            resultado,
            arquivo,
            blob,
            urlResultadoAtual,
            "processada"
        );
    }, formato, formato === "image/png" ? undefined : qualidade);
}

// ===== REDIMENSIONAMENTO =====

function redimensionarImagem(imagem, arquivo) {
    const campoLargura = document.getElementById("largura-imagem");
    const campoAltura = document.getElementById("altura-imagem");
    const formato = document.getElementById("formato-saida").value;
    const qualidade =
        Number(document.getElementById("qualidade-imagem").value) / 100;

    const resultado =
        document.getElementById("resultado-redimensionamento");

    const botao =
        document.getElementById("redimensionar-imagem");

    const largura = Number(campoLargura.value);
    const altura = Number(campoAltura.value);

    if (
        !Number.isInteger(largura) ||
        !Number.isInteger(altura) ||
        largura < 1 ||
        altura < 1 ||
        largura > DIMENSAO_MAXIMA ||
        altura > DIMENSAO_MAXIMA
    ) {
        resultado.textContent =
            "Informe largura e altura inteiras entre 1 e " +
            `${DIMENSAO_MAXIMA} pixels.`;
        return;
    }

    if (largura * altura > PIXELS_MAXIMOS) {
        resultado.textContent =
            "Essa dimensão é muito grande para o processamento. " +
            "Reduza a largura ou a altura.";
        return;
    }

    botao.disabled = true;
    resultado.textContent = "Redimensionando imagem...";

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");

    if (!contexto) {
        resultado.textContent =
            "Não foi possível iniciar o redimensionamento.";
        botao.disabled = false;
        return;
    }

    canvas.width = largura;
    canvas.height = altura;

    prepararFundo(contexto, formato, largura, altura);

    contexto.drawImage(imagem, 0, 0, largura, altura);

    canvas.toBlob((blob) => {
        botao.disabled = false;

        if (!blob) {
            resultado.textContent =
                "Não foi possível gerar a imagem redimensionada.";
            return;
        }

        if (blob.type !== formato) {
            resultado.textContent =
                "O navegador não conseguiu gerar esse formato. " +
                "Tente JPEG ou WebP.";
            return;
        }

        liberarUrl("redimensionamento");

        urlRedimensionadaAtual = URL.createObjectURL(blob);

        mostrarResultado(
            resultado,
            arquivo,
            blob,
            urlRedimensionadaAtual,
            "redimensionada"
        );

        resultado.insertAdjacentHTML(
            "afterbegin",
            `<p><strong>Novas dimensões:</strong> ${largura} × ${altura} pixels</p>`
        );
    }, formato, formato === "image/png" ? undefined : qualidade);
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

        <a href="${url}" download="${nomeDownload}">
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
    if (urlImagemAtual) {
        URL.revokeObjectURL(urlImagemAtual);
        urlImagemAtual = null;
    }

    liberarResultadoAnterior();
    imagemAtual = null;
});
