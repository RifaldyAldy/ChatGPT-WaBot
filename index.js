// Menambahkan dependencies
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');
const GPT = require('./openai');

// fungsi utama WA BOT
async function connectToWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('Auth_info_logins');
  // console.log(state);

  // buat koneksi baru
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  });

  // Handler untuk event 'connection.update'
  function handleConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reconnecting = (lastDisconnect.error === Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi terputus karena ${lastDisconnect.error}, Hubungkan kembali! ${reconnecting}`);
      if (reconnecting) {
        connectToWhatsapp();
      }
    } else if (connection === 'open') {
      console.log('Terhubung!');
    }
  }

  // Menambahkan listener untuk event 'connection.update'
  sock.ev.on('connection.update', handleConnectionUpdate);

  await sock.ev.on('creds.update', saveCreds);

  // Fungsi untuk memantau pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`Tipe pesan : ${type}`);
    if (type === 'notify' && !messages[0].key.fromMe) {
      try {
        console.log(messages);
        const number = messages[0].key.remoteJid;
        let chat = messages[0].message.conversation;
        if (!chat) {
          chat = messages[0].message.extendedTextMessage.text;
        }
        const ambilRequest = chat.split(' ').slice(1).join(' ').toString();

        //membuat variabel untuk mengecek apakah pesan dari group dan mention bot
        const isMessageGroup = number.includes('@g.us');
        const isMessageMentionBot = chat.includes('@628388995241');

        console.log(number);
        console.log(chat);
        if (chat.toLowerCase() === 'ping') {
          const send = await sock.sendMessage(number, { text: 'Halo, selamat datang di AlfaMampus!' }, { quoted: messages[0] }, 2000);
        }

        //logic jika mention bot saja
        if (isMessageGroup && isMessageMentionBot) {
          const req = await GPT(ambilRequest);
          await sock.sendMessage(number, { text: req }, { quoted: messages[0] }, 2000);
          console.log(ambilRequestChat);
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
}

// menjalankan Whatsapp bot
connectToWhatsapp().catch((error) => {
  console.log(error);
});
