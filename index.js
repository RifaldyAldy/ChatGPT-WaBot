// Menambahkan dependencies
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');

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
    console.log(messages);
    if (type === 'notify') {
      try {
        const number = messages[0].key.remoteJid;
        const chat = messages[0].message.conversation;
        console.log(number);
        console.log(chat);
        if (chat.toLowerCase() === 'ping') {
          const send = await sock.sendMessage(number, { text: 'Halo, selamat datang di AlfaMampus!' }, { quoted: messages[0] }, 1000);
          console.log(messages[1]);
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
}

connectToWhatsapp().catch((error) => {
  console.log(error);
});
