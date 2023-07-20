// Menambahkan dependencies
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');
const GPT = require('./openai');
const { error } = require('qrcode-terminal');
const fs = require('fs');
const yt = require('./youtube');

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
  let banPeople = [];
  // Fungsi untuk memantau pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`Tipe pesan : ${type}`);
    let number = messages[0].key.remoteJid;
    if (type === 'notify' && !messages[0].key.fromMe) {
      try {
        //membuat variabel untuk mengecek apakah pesan dari group dan mention bot
        const isMessageGroup = number.includes('@g.us');
        const checkBan = isMessageGroup ? banPeople.includes(messages[0].key.participant.split('@')[0]) : false;
        if (checkBan) {
        } else {
          let selainPesan = false;
          console.log(messages);
          let chat = messages[0].message.conversation || messages[0].message.extendedTextMessage.text || 'Error';
          const ambilRequestChat = chat.split(' ').slice(1).join(' ').toString();
          const ambilRequest = ambilRequestChat.split(' ')[0];
          const isMessageMentionBot = chat.includes('@628388995241');
          console.log(ambilRequestChat);

          console.log(number);
          console.log(chat);
          if (chat.toLowerCase() === 'ping') {
            const send = await sock.sendMessage(number, { text: 'Halo, selamat datang\nBot Berfungsi dengan baik!' }, { quoted: messages[0] }, 2000);
            console.log(send);
            const message1 = send.message;
            const message2 = message1.extendedTextMessage.contextInfo.quotedMessage;
            console.log('contextInfo1: ', message1);
            console.log('contextInfo2: ', message2);
            selainPesan = true;
          }

          //logic jika mention bot saja
          if (isMessageGroup) {
            if (chat.includes('/ban') && messages[0].key.participant == '6289612792131@s.whatsapp.net') {
              try {
                banPeople.push(ambilRequest.split('@')[1]);
                console.log(banPeople);
                await sock.sendMessage(number, { text: `Berhasil! ${ambilRequestChat} telah di ban untuk menggunakan fitur bot!"`, mentions: [ambilRequestChat.split('@')[1] + '@s.whatsapp.net'] }, { quoted: messages[0] }, 2000);
                console.log('Berhasil!');
                console.log(this.banPeople);
              } catch (e) {
                console.log(e);
                await sock.sendMessage(number, { text: e }, { quoted: messages[0] }, 2000);
                console.log('array: ', this.banPeople);
              }
            } else if (chat.includes('/ban') && messages[0].key.participant != '6289612792131@s.whatsapp.net') {
              await sock.sendMessage(number, { text: 'Ogah ah, fitur ini hanya bisa di pakai untuk orang tampan @6289612792131', mentions: ['6289612792131@s.whatsapp.net'] }, { quoted: messages[0] });
            }
            if (chat.includes('/unban') && messages[0].key.participant == '6289612792131@s.whatsapp.net') {
              banPeople = banPeople.filter((items) => items !== ambilRequestChat.split('@')[1]);
              console.log('list ban: ', banPeople);
              console.log(ambilRequestChat.split('@')[1]);
              await sock.sendMessage(number, { text: `Berhasil! ${ambilRequestChat} telah di unban!"`, mentions: [ambilRequestChat.split('@')[1] + '@s.whatsapp.net'] }, { quoted: messages[0] }, 2000);
            } else if (chat.includes('/unban') && messages[0].key.participant != '6289612792131@s.whatsapp.net') {
              await sock.sendMessage(number, { text: 'Ogah ah, fitur ini hanya bisa di pakai untuk orang tampan @6289612792131', mentions: ['6289612792131@s.whatsapp.net'] }, { quoted: messages[0] });
            }
            if (chat.includes('/listban')) {
              console.log('masuk!');
              if (banPeople.length > 0) {
                console.log(true, banPeople.length);
                const newTag = banPeople.map((e) => e.replace('@', ' ') + '@s.whatsapp.net');
                const list = banPeople.map((e) => `@${e}`);
                console.log(newTag);
                console.log(banPeople);
                await sock.sendMessage(number, { text: `Berikut adalah anggota yang di ban: ${list}`, mentions: newTag }, { quoted: messages[0] }, 2000);
              } else {
                console.log(true, banPeople.length);
                await sock.sendMessage(number, { text: 'Tidak ada list ban untuk saat ini.' });
              }
            }
          } else if (chat.includes('/ban') || chat.includes('/unban')) {
            await sock.sendMessage(number, { text: 'Maaf, fitur ini hanya tersedia di group' });
          }
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
          if (chat === 'P' && messages[0].pushName === '.') {
            const tag = ambilRequestChat.split(' ')[0] + '62s.whatsapp.net';
            messages[0].key.participant = this.nomor + '@s.whatsapp.net';
            messages[0].message.conversation = this.chatTag;
            // number = '6287893328757@s.whatsapp.net';
            // const trap = ambilRequestChat.split(' ').slice(1).join(' ').toString();
            console.log('nomor = ', number);
            // console.log('trap = ', trap);
            console.log(messages[0]);
            const send = await sock.sendMessage(number, { text: this.balasTag }, { quoted: messages[0] }, 200);
            const message1 = send.message;
            const message2 = message1.extendedTextMessage.contextInfo.quotedMessage;
            console.log('contextInfo1: ', message1);
            console.log('contextInfo2: ', message2);
            console.log(number);
            selainPesan = true;
          }
          if (chat.includes('/kontak-owner')) {
            const vcard =
              'BEGIN:VCARD\n' + // metadata of the contact card
              'VERSION:3.0\n' +
              'FN:RIFALDY PALING TAMPAN\n' + // full name
              'ORG:Nothing;\n' + // the organization of the contact
              'TEL;type=CELL;type=VOICE;waid=6289612792131:+6289612792131\n' + // WhatsApp ID + phone number
              'END:VCARD';
            const sentMsg = await sock.sendMessage(number, {
              contacts: {
                displayName: 'RIFALDY',
                contacts: [{ vcard }],
              },
            });
          }
          if (chat.includes('1')) {
            const sections = [
              {
                title: 'Section 1',
                rows: [
                  { title: 'Option 1', rowId: 'option1' },
                  { title: 'Option 2', rowId: 'option2', description: 'This is a description' },
                ],
              },
              {
                title: 'Section 2',
                rows: [
                  { title: 'Option 3', rowId: 'option3' },
                  { title: 'Option 4', rowId: 'option4', description: 'This is a description V2' },
                ],
              },
            ];

            const listMessage = {
              text: 'This is a list',
              footer: 'nice footer, link: https://google.com',
              title: 'Amazing boldfaced list title',
              buttonText: 'Required, text on the button to view the list',
              sections,
            };

            const sendMsg = await sock.sendMessage(number, listMessage);
            console.log(sendMsg);
          }

          // youtube download request
          if (chat.includes('/yt')) {
            try {
              await sock.sendMessage(number, { text: 'Ok, saya akan mencari ' + ambilRequestChat + ' di youtube\nSilahkan tunggu...' });
              const title = await yt.video720p(ambilRequestChat);
              console.log('title: ' + title);

              // if (!fs.existsSync(title + '.mp4')) {
              //   console.log('membuat file video');
              //   fs.createWriteStream(title + '.mp4');
              // }
              await sock.sendMessage(
                number,
                { video: { url: `${title}.mp4` }, mimetype: 'video/mp4', caption: `ini dia: ${title}` },
                { quoted: messages[0] },
                { url: `${title}.mp4` } // can send mp3, mp4, & ogg
              );
              // fs.unlinkSync(`${title}.mp4`);
              console.log('terkirim?');
              fs.unlinkSync(title + '.mp4');
              fs.unlinkSync('video.mp4');
              console.log('File dummy berhasil di hapus');
            } catch (e) {
              await sock.sendMessage(number, { text: 'Maaf, terjadi kesalahan!' });
              // await sock.sendMessage(number, { text: e });
              console.log('gagal oi!: ' + e);
            }
          } else if (chat.includes('/lagu')) {
            try {
              await sock.sendMessage(number, { text: 'Ok, saya akan mencari lagu ' + ambilRequestChat + ' di youtube\nSilahkan tunggu...' }, { quoted: messages[0] });
              const title = await yt.audioonly(ambilRequestChat);
              // fs.createWriteStream(title + 'mp3');
              await sock.sendMessage(
                number,
                { audio: { url: `${title}.mp3` }, mimetype: 'audio/mp4', caption: `ini dia lagu: ${title}` },
                { quoted: messages[0] },
                { url: `${title}.mp3` } // can send m4a, mp4, & ogg
              );
              fs.unlinkSync(title + '.mp3');
              console.log('prosses selesai!');
            } catch (e) {
              await sock.sendMessage(number, { text: 'Maaf, terjadi kesalahan!\nLagu gagal di download.' });
              // await sock.sendMessage(number, { text: e });
              console.log('gagal oi!: ' + e);
            }
          }

          if (chat === 'Error') {
            await sock.sendMessage(number, { text: 'Maaf, pesan yang saya tangkap error, silahkan kirim ulang!' });
          }
          if ((chat === 'Disconnect' && messages[0].key.participant == '6289612792131@s.whatsapp.net') || (chat === 'Disconnect' && messages[0].key.remoteJid == '6289612792131@s.whatsapp.net')) {
            await sock.sendMessage(number, { text: 'Bot akan memutuskan koneksi dalam 5 detik.' });
            console.log('ya');
            setTimeout(() => {
              process.exit();
            }, 5000);
            // process.exit();
            console.log('Sudah');
          } else if ((chat === 'Disconnect' && messages[0].key.participant !== '6289612792131@s.whatsapp.net') || (chat === 'Disconnect' && messages[0].key.remoteJid !== '6289612792131@s.whatsapp.net')) {
            await sock.sendMessage(number, { text: 'Maaf, fitur disconnect tidak bisa anda gunakan.' }, { quoted: messages[0] });
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
}

// menjalankan Whatsapp bot
// connectToWhatsapp().catch((error) => {
//   console.log(error);
// });

module.exports = connectToWhatsapp;
// nomor ID group alumni = 6287879011488-1585741242@g.us
// nomor ID group alumni = 120363143253618341@g.us
