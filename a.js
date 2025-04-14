const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')
let prank = false

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('session')

        const sock = makeWASocket({
            browser: ['RandSfk', 'iOS', '17.4.1'],
            auth: state,
            printQRInTerminal: true  // Set this to true if you want the QR code in terminal
        })

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                qrcode.generate(qr, { small: true })
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
                console.log('Connection closed, reconnecting...', shouldReconnect)
                if (shouldReconnect) {
                    startBot() // Consider adding a limit for reconnections
                }
            } else if (connection === 'open') {
                console.log('Bot connected!')
            }
        })

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            const msg = messages[0]
            if (!msg.key.fromMe && (msg.message?.conversation || msg.message?.extendedTextMessage?.text)) {
                const text = msg.message.conversation.toLowerCase()
                await sock.readMessages([msg.key])

                if (prank) {
                    const response = `> â“˜ _Nomor ini untuk sementara dilarang dari WhatsApp karena telah melanggar Panduan Komunitas dan di sita Oleh Pihak Kepolisian Republik Indonesia_`
                    await sock.sendMessage(msg.key.remoteJid, { text: response })
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: `Rivalnya masih tidur ya Acaa \n> note: _-VelriVall_` })
                }

                if (text === 'prank on') {
                    prank = true
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Prank mode ON' })
                } else if (text === 'prank off') {
                    prank = false
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Prank mode OFF' })
                }
            }
        })

        sock.ev.on('creds.update', saveCreds)
    } catch (error) {
        console.error("Error starting bot:", error)
    }
}

startBot()
