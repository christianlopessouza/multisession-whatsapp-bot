// modules
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { salvaQrCode, RetornaMensagem } = require('./modules/acoes_wpp.js');

//variaveis globais
var chromiumExecutablePath = path.join(path.dirname(process.execPath), 'chromium', puppeteer.executablePath().split(".local-chromium")[1]);

const props = JSON.parse(fs.readFileSync('./entity.json', 'utf8'));
const { idPrograma, descricao, ordemEnvio } = props;


if (!process.pkg) chromiumExecutablePath = puppeteer.executablePath();

const client = new Client({

    authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: './whats_session/'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
        executablePath: chromiumExecutablePath
    }

})

// LISTENERS
client.on('qr', qr => { // geração QRCode

    //salvaQrCode(qr, 0, idPrograma)
    qrcode.generate(qr, { small: true });

});

client.on('authenticated', (session) => { // após QRCode ser escaneado

    //salvaQrCode(null, 1, idPrograma);
    console.log("Autenticado")

})

client.on('ready', () => { // após QRCode ser escaneado e autenticado

    console.log('Pronto para enviar!');
    //RetornaMensagem(props, client);

});
//


const start = () => {

    console.log(`Programa: ${descricao}`);
    console.log(`Ordem: ${ordemEnvio} `);

    client.initialize()

    console.log(client)
    
};

start();