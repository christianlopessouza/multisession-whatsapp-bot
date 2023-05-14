const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');


class WhatsAppClient {
    constructor(phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.client = new Client();
        this.initialize();
        this.qrcode;
        this.queue = {};
    }

    initialize() {
        this.client.on('qr', (qr) => {
            qrcode.toDataURL(qr, (err, url) => {
                this.qrcode = qr;
                // console.log(`Scan the QR code for ${this.phoneNumber}: ${qr}`);
            });
        });

        this.client.on('ready', () => {
            // console.log(`WhatsApp client for ${this.phoneNumber} is ready!`);
        });

        this.client.initialize();
    }

    async sendMessage(to, message) {
        const chat = await this.client.getChatById(to);
        return chat.sendMessage(message);
    }
}

const app = express();

const phones = ['+1234567890', '+0987654321'];
const clients = {};

phones.forEach((phone) => {
    clients[phone] = new WhatsAppClient(phone);
});
app.use(bodyParser.json());

app.get('/:phone/qrcode', (req, res) => {
    const { phone } = req.params;

    try {
        const user = clients[phone];
        if (!user) {
            throw new Error(`WhatsApp client for ${phone} not found!`);
        }

        const qr = user.qrcode;
        //qrcode.toDataURL(qr, (err, url) => {
        res.send(qr);
        //});
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

app.get('/lista', (req, res) => {
    let list = {};

    for (const key in clients) {
        list[key] = clients[key].qrcode;
    }

    res.send(list)
})

app.get()

app.get('/:phone/send-message', async (req, res) => {
    const { phone } = req.params;
    const { to, message } = req.query;
    console.log(req.query)

    try {
        const client = clients[phone];
        if (!client) {
            throw new Error(`WhatsApp client for ${phone} not found!`);
        }

        await client.sendMessage(to, message);
        res.send(`Message sent from ${phone} to ${to}: ${message}`);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

app.post('/phones', (req, res) => {
    console.log(req)
    const { phone } = req.body;

    try {
        if (phones.includes(phone)) {
            throw new Error(`WhatsApp client for ${phone} already exists!`);
        }

        phones.push(phone);
        clients[phone] = new WhatsAppClient(phone);

        res.send(`WhatsApp client for ${phone} has been created!`);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// substitua todos nomes de variaveis app para aplicacao