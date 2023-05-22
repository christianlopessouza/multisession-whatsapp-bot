const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');
const cors = require('cors');


class WhatsAppClient {
    constructor(phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.client = new Client();
        this.initialize();
        this.qrcode = "Gerando QR Code";
        this.queue = {};
        this.lotes = [];
        this.mensagens_enviadas = [];
        this.enviando_mensagens = false;
    }

    initialize() {
        this.client.on('qr', (qr) => {
            qrcode.toDataURL(qr, (err, url) => {
                this.qrcode = qr;
                // console.log(`Scan the QR code for ${this.phoneNumber}: ${qr}`);
            });
        });

        this.client.on('ready', () => {
            this.qrcode = "QR Escaneado"
            // console.log(`WhatsApp client for ${this.phoneNumber} is ready!`);
        });

        this.client.initialize();
    }

    destroy() {
        this.client.destroy();

        //delete clients[this.phoneNumber];
    }

    addMensagensEnviadas(id, status) {
        this.mensagens_enviadas[0].push({
            id: id,
            status: status,
            data_envio: date('Y-m-d H:i:s')
        });
    }

    async enviarMensagens() {
        let number_details;
        let client = this.client;

        // verificar conexão

        if (this.lotes.length === 0 || this.enviandoMensagens === false) {
            this.enviandoMensagens = false; // Sinalizar que não há mais mensagens sendo enviadas
            return; // Se não houver mensagens pendentes, sair da função
        }

        const mensagem = this.lotes.shift(); // Obter a próxima mensagem do array de lotes

        const { id, number, message } = mensagem;

        if (number.length >= 12 && number.length <= 14) {
            number_details = await client.getNumberId(number);
        } else {
            number_details = false;
        }

        if (number_details) {
            try {
                const chatId = await client.getNumberId(number);
                await client.sendMessage(chatId._serialized, message);
                addMensagensEnviadas(id, true)

                // Atraso aleatório de 10 a 20 segundos (em milissegundos)
                const delay = Math.floor(Math.random() * 10000) + 10000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (error) {
                addMensagensEnviadas(id, false)
            }
        } else {
            addMensagensEnviadas(id, false)
        }

        this.enviarMensagem();
    }

    stop() {
        this.enviando_mensagens = false;
    }

    async resume() {
        this.enviando_mensagens = true;
        await this.enviarMensagens();
    }

    adicionarNovoLote(lista_mensagens) {
        try {
            this.lotes.push(lista_mensagens);
            this.mensagens_enviadas.push([]);
            return { sucesso: true };

        } catch (error) {
            return { sucesso: false };

        }
    }

    async init(phone) {
        clients[phone] = new WhatsAppClient(phone);

        const qrCode = await new Promise((resolve, reject) => {
            clients[phone].client.on('qr', (qr) => {
                resolve(qr);
            });
        });

        return qrCode;
    }

    async verificaConexao() {
        const client = this.client;
        const phone = this.phoneNumber;
        try {

            const connectionStatus = await client.getState();

            if (connectionStatus === "CONNECTED") {
                // Cliente já está autenticado
                return { retorno: { status: 4 }, http_status: 200 };

            } else {
                // Cliente não está autenticado, enviar QR code novamente
                this.destroy();
                const qrCode = await this.init(phone)

                return { retorno: { status: 3, qrcode: qrCode }, http_status: 200 };
            }

        } catch (error) {
            const qrCode = await this.init(phone)
            return { retorno: { status: 3, qrcode: qrCode }, http_status: 200 };

        }

    }

}

const app = express();
const clients = {};

app.use(bodyParser.json());
app.use(cors());




/*app.post('/:phone/send-message', async (req, res) => {
    const { phone } = req.params;
    const messages = req.body;

    //await verificaConexao(phone);

    for (const request of messages) {
        const { number, message } = request;
        try {
            const client = clients[phone].client;
            if (!client) {
                throw new Error(`WhatsApp client for ${phone} not found!`);
            }

            console.log(number, message, "OMG")

            const chatId = await client.getNumberId(number);
            await client.sendMessage(chatId._serialized, message);
            request.status = true;

        } catch (error) {
            console.error(error);
            request.status = error

        }

    }

    res.send(messages);
});
*/
async function verificaInstancia(phone) {

    if (!clients.hasOwnProperty(phone)) {
        // Cadastrar novo cliente
        clients[phone] = new WhatsAppClient(phone);
    }



    const client = clients[phone];
    const retorno = client.verificaConexao();


    return retorno;


}

app.get('/:phone/add', async (req, res) => {
    const { phone } = req.params;

    const { retorno, http_status } = await verificaInstancia(phone);

    res.status(http_status).send(retorno);

});



app.post('/:phone/enviar-lote-mensagens', async (req, res) => {
    const { phone } = req.params;
    const { lista_mensagens } = req.body;

    const client = clients[phone];

    const retorno = client.adicionarNovoLote(lista_mensagens);

    console.log(retorno)

    res.send(retorno)
})


app.get('/lista', (req, res) => {
    let list = {};

    for (const key in clients) {
        list[key] = clients[key].qrcode;
    }

    res.send(list)
})

app.get('/:phone/parar-envio', (req, res) => {
    const { phone } = req.params;
    const client = clients[phone];

    client.stop();

    res.send({ "sucesso": true })
})

app.get('/:phone/qrcode', (req, res) => {
    const { phone } = req.params;

    try {
        const user = clients[phone];
        if (!user) {
            throw new Error(`WhatsApp client for ${phone} not found!`);
        }

        const qrCode = user.qrcode;
        res.send({ qrcode: qrCode });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


// substitua todos nomes de variaveis app para aplicacao