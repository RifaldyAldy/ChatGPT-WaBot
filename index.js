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

  let nomor = 0;
  let chatTag = '';
  let balasTag = '';
  // Fungsi untuk memantau pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`Tipe pesan : ${type}`);
    let number = messages[0].key.remoteJid;
    if (type === 'notify' && !messages[0].key.fromMe) {
      try {
        let selainPesan = false;
        console.log(messages);
        let chat = messages[0].message.conversation || messages[0].message.extendedTextMessage.text || 'Error';

        const ambilRequestChat = chat.split(' ').slice(1).join(' ').toString();
        const ambilRequest = ambilRequestChat.split(' ')[0];
        console.log(ambilRequestChat);

        //membuat variabel untuk mengecek apakah pesan dari group dan mention bot
        const isMessageGroup = number.includes('@g.us');
        const isMessageMentionBot = chat.includes('@628388995241');

        console.log(number);
        console.log(chat);
        if (chat.toLowerCase() === 'ping') {
          const send = await sock.sendMessage(number, { text: 'Halo, selamat datang\nBot Berfungsi dengan baik!' }, { quoted: messages[0] }, 2000);
          selainPesan = true;
        }

        //logic jika mention bot saja
        if (chat.includes('/nanya')) {
          await sock.sendMessage(number, { text: 'Sebentar sedang mikir...' }, { quoted: messages[0] }, 2000);
          const req = await GPT(ambilRequestChat);
          await sock.sendMessage(number, { text: req }, { quoted: messages[0] }, 2000);
          selainPesan = true;
          // console.log(ambilRequestChat);
        }
        if (chat.includes('/set')) {
          this.nomor = chat.split(' ')[1];
          this.chatTag = chat.split(' ').slice(2).join(' ');
          selainPesan = true;
        }
        if (chat.includes('/balas')) {
          this.balasTag = chat.split(' ').slice(1).join(' ');
          selainPesan = true;
        }
        if (chat.includes('P') && messages[0].pushName === '.') {
          const tag = ambilRequestChat.split(' ')[0] + '62s.whatsapp.net';
          messages[0].key.participant = this.nomor + '@s.whatsapp.net';
          messages[0].message.conversation = this.chatTag;
          // number = '6287893328757@s.whatsapp.net';
          // const trap = ambilRequestChat.split(' ').slice(1).join(' ').toString();
          console.log('nomor = ', number);
          // console.log('trap = ', trap);
          console.log(messages[0]);
          await sock.sendMessage(number, { text: this.balasTag }, { quoted: messages[0] }, 200);
          console.log(number);
          selainPesan = true;
        }
        if (selainPesan === false) {
          if (!isMessageGroup) {
            await sock.sendMessage(number, { text: `Maaf, pesan anda tidak saya kenali,\nuntuk membuat pertanyaan silahkan pakai kunci \n"/nanya (pertanyaan anda)"` }, { quoted: messages[0] }, 2000);
          } else if (isMessageGroup && isMessageMentionBot) {
            await sock.sendMessage(
              number,
              {
                text: `Maaf, pesan anda tidak saya kenali,\nuntuk membuat pertanyaan silahkan pakai kunci \n"@tag_bot /nanya (pertanyaan anda) \n\nContoh : @628388995241 /nanya berapa derajat panas hari ini?"`,
                mentions: ['628388995241@s.whatsapp.net'],
              },
              { quoted: messages[0] },
              2000
            );
          }
        }
        if (chat === 'Error') {
          await sock.sendMessage(number, { text: 'Maaf, pesan yang saya tangkap error, silahkan kirim ulang!' });
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

// nomor ID group alumni = 6287879011488-1585741242@g.us
// nomor ID group alumni = 120363143253618341@g.us
