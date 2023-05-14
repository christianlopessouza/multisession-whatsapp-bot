const date = require('date-and-time');

function agora() {
    var dataEnvio = new Date();
    dataEnvio = date.format(dataEnvio, 'YYYY/MM/DD HH:mm:ss');
    return dataEnvio;
}

function apenasNumeros(string) {
    var numsStr = string.replace(/[^0-9]/g, '');
    return numsStr + "00";
}

function delayMensagem(min = 0, max = 30) {
    min *= 1000;
    max *= 1000;
    return Math.floor(Math.random() * (max - min) + min);
}

function verificaFinalSemana(hoje) {
    if (hoje === 0 || hoje === 6) {
        return true
    }
    return false
}

function verificaHorarioFuncionamento(min, max, horaAtual) {
    let horarioAtual = date.format(horaAtual, 'HHmmss');

    let minimoHora = apenasNumeros(min);
    let maximoHora = apenasNumeros(max);
    if (horarioAtual >= minimoHora && horarioAtual <= maximoHora) {
        return true;
    } else {
        return false;
    }
}

module.exports = { agora, delayMensagem, verificaFinalSemana, verificaHorarioFuncionamento };