"use strict";

// ===== REDIMENSIONAMENTO EM LOTE =====

const campoArquivosLote = document.getElementById("arquivos-lote");
const campoLarguraLote = document.getElementById("largura-lote");
const campoAlturaLote = document.getElementById("altura-lote");
const campoProporcaoLote = document.getElementById("proporcao-lote");
const botaoProcessarLote = document.getElementById("processar-lote");
const estadoLote = document.getElementById("estado-lote");
const resultadosLote = document.getElementById("resultados-lote");

const MAXIMO_ARQUIVOS_LOTE = 10;
const MAXIMO_BYTES_LOTE = 20 * 1024 * 1024;
const MAXIMO_PIXELS_LOTE = 40000000;
const MAXIMA_DIMENSAO_LOTE = 10000;

const FORMATOS_LOTE = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const urlsLote = [];

function limparResultadosLote() {
    urlsLote.forEach((url) => URL.revokeObjectURL(url));
    urlsLote.length = 0;
    resultadosLote.replaceChildren();
}

function validarDimensoesLote(largura, altura) {
    return Number.isInteger(largura) &&
        Number.isInteger(altura) &&
        largura >= 1 &&
        altura >= 1 &&
        largura <= MAXIMA_DIMENSAO_LOTE &&
        altura <= MAXIMA_DIMENSAO_LOTE &&
        largura * altura <= MAXIMO_PIXELS_LOTE;
}

function carregarImagemLote(arquivo) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(arquivo);
        const imagem = new Image();

        imagem.onload = () => {
            URL.revokeObjectURL(url);
            resolve(imagem);
        };

        imagem.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Não foi possível abrir a imagem."));
        };

        imagem.src = url;
    });
}

function redimensionarArquivoLote(imagem, larguraSolicitada, alturaSolicitada) {
    let largura = larguraSolicitada;
    let altura = alturaSolicitada;

    if (campoProporcaoLote.checked) {
        const escala = Math.min(
            larguraSolicitada / imagem.naturalWidth,
            alturaSolicitada / imagem.naturalHeight
        );

        largura = Math.max(1, Math.round(imagem.naturalWidth * escala));
        altura = Math.max(1, Math.round(imagem.naturalHeight * escala));
    }

    if (!validarDimensoesLote(largura, altura)) {
        throw new Error("As dimensões resultantes excedem os limites permitidos.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
        throw new Error("Não foi possível iniciar o processamento.");
    }

    contexto.drawImage(imagem, 0, 0, largura, altura);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Não foi possível gerar o PNG."));
                return;
            }

            resolve({ blob, largura, altura });
        }, "image/png");
    });
}

botaoProcessarLote.addEventListener("click", async () => {
    const arquivos = Array.from(campoArquivosLote.files);
    const largura = Number(campoLarguraLote.value);
    const altura = Number(campoAlturaLote.value);

    if (!arquivos.length) {
        estadoLote.textContent = "Selecione pelo menos uma imagem.";
        return;
    }

    if (arquivos.length > MAXIMO_ARQUIVOS_LOTE) {
        estadoLote.textContent = "Selecione no máximo 10 imagens por operação.";
        return;
    }

    if (!validarDimensoesLote(largura, altura)) {
        estadoLote.textContent =
            "Informe dimensões inteiras válidas, respeitando o limite de pixels.";
        return;
    }

    limparResultadosLote();
    botaoProcessarLote.disabled = true;
    estadoLote.textContent = "Processando imagens...";

    let concluidas = 0;

    try {
        for (const arquivo of arquivos) {
            const item = document.createElement("p");

            if (
                !FORMATOS_LOTE.includes(arquivo.type) ||
                arquivo.size === 0 ||
                arquivo.size > MAXIMO_BYTES_LOTE
            ) {
                item.textContent =
                    `${arquivo.name}: formato inválido ou arquivo acima de 20 MB.`;
                resultadosLote.appendChild(item);
                continue;
            }

            try {
                const imagem = await carregarImagemLote(arquivo);
                const resultado = await redimensionarArquivoLote(
                    imagem,
                    largura,
                    altura
                );

                const url = URL.createObjectURL(resultado.blob);
                urlsLote.push(url);

                const nomeBase =
                    arquivo.name.replace(/\.[^.]+$/, "") || "imagem";
                const nomeDownload = `${nomeBase}-redimensionada.png`;

                item.append(
                    `${arquivo.name} — ${resultado.largura} × ${resultado.altura} px: `
                );

                const link = document.createElement("a");
                link.href = url;
                link.download = nomeDownload;
                link.textContent = `Baixar ${nomeDownload}`;
                link.className = "botao-download-edicao";

                item.appendChild(link);
                resultadosLote.appendChild(item);
                concluidas++;
            } catch (erro) {
                item.textContent = `${arquivo.name}: ${erro.message}`;
                resultadosLote.appendChild(item);
            }
        }

        estadoLote.textContent =
            `Concluído: ${concluidas} de ${arquivos.length} imagem(ns) processada(s).`;
    } finally {
        botaoProcessarLote.disabled = false;
    }
});

window.addEventListener("pagehide", limparResultadosLote);
