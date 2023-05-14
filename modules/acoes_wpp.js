const { agora, delayMensagem, verificaFinalSemana, verificaHorarioFuncionamento } = require('./function');
const delay = require('delay');
const XMLHttpRequest = require('xhr2');
const xhttp = new XMLHttpRequest();
const request = require('request');

function salvaQrCode(qrCode, metodo, idPrograma) {
    request.post(
        'https://wpp.gruposuper.com.br/api/nodejs/salvaQRcode.php',
        { form: { id_programa: idPrograma, qr: qrCode, acao: metodo } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        }
    );
}

async function SendMessage(mensagem, client) {
    return new Promise(async (resolve) => {

        let number_details;
        let mensagensEnviadas = 0;
        let number = "55" + mensagem.numero;

        if (number.length >= 12 && number.length <= 14) {
            number_details = await client.getNumberId(number);
        } else {
            number_details = false;
        }

        if (number_details) {
            console.log(`Número: ${number_details.user}`);
            client.sendMessage(number_details._serialized, mensagem.texto).then(e => {
                mensagensEnviadas++;
                SaveMessage(mensagem.id)

                console.log(e.body + "\n")
                console.log(`Enviado [${agora()}]` + "\n")
                console.log(`Mensagens Enviadas = ${mensagensEnviadas}`)

                resolve(true)
            })
        } else {
            console.log(`Número Inválido: ${number}`)
            SaveMessage(mensagem.id, 2)
            resolve(false)
        }

    })
}

function SaveMessage(id, status = 1) {
    request.post(
        'https://wpp.gruposuper.com.br/api/nodejs/atualizaMensagem.php',
        { form: { idMensagem: id, statusMensagem: status } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //console.log(body);
            }
        }
    );
}


function controleDeEnvio(props,client,minutos = 20, motivo = 0) {
    let primeiraMensagem;
    let segundaMensagem;

    let milisecundos = (minutos * 60000);

    switch (motivo) {
        case 0:
            primeiraMensagem = `Não há mensagens para serem enviadas ${agora()}`;
            segundaMensagem = "Verificando se há novas mensagens";
            break;
        case 1:
            primeiraMensagem = `Fora do Horário de funcionamento ${agora()}`;
            segundaMensagem = ".";
            break;
        case 2:
            primeiraMensagem = `Fora do dia de funcionamento ${agora()}`;
            segundaMensagem = ".";
        default:
            break;
    }

    console.log(primeiraMensagem);
    gap = setTimeout(() => {
        console.log(segundaMensagem);
        RetornaMensagem(props, client);
    }, milisecundos) 
}

function RetornaMensagem(props, client) {
    const { minHorarioFuncionamento, maxHorarioFuncionamento, gapMinSegundos, gapMaxSegundos, verificaNovaMensagemMinutos, idPrograma, ordemEnvio } = props;

    xhttp.onload = async function () {
        const xmlDoc = this;
        let lote = JSON.parse(xmlDoc.responseText);
        let motivo = 0;
        let hoje = new Date();
        let finalDeSemana = verificaFinalSemana(hoje.getDay());
        let verificaHorario = verificaHorarioFuncionamento(minHorarioFuncionamento, maxHorarioFuncionamento, hoje);

        if (lote.retorno && verificaHorario && finalDeSemana === false) {
            (async () => {
                await SendMessage(lote.msg, client);
                let tempoEspera = delayMensagem(gapMinSegundos, gapMaxSegundos);
                await delay(tempoEspera);
                RetornaMensagem(props, client);
            })();

        } else {
            if (!verificaHorario) motivo = 1;
            controleDeEnvio(props, client, verificaNovaMensagemMinutos, motivo);

        }

    };
    xhttp.open("GET", `https://wpp.gruposuper.com.br/api/nodejs/retornaMensagem.php?i=${idPrograma}&o=${ordemEnvio}`);
    xhttp.send();
}


// PARA RESOLVER O BUG DA VERSAO FOI NECESSARIO CRIAR UMA VERSAO CUSTOMIZADA
async function GetNumberId(number) {
    const parts = currentVersion?.split('.') ?? 0
    const minor = parseInt(parts[1] ?? '0')

    if (minor < 2224) return await client.getNumberId(number) // Use lib version

    if (!number.endsWith('@c.us')) {
        number += '@c.us'
    }

    return await client.pupPage.evaluate(async (number) => {
        const wid = window.Store.WidFactory.createWid(number)
        const result = await window.Store.QueryExist(wid)
        if (!result || result.wid === undefined) return null
        return result.wid
    }, number)
}

module.exports = { salvaQrCode, RetornaMensagem }