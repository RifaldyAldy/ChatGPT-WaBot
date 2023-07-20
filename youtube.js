const fs = require('fs');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const axios = require('axios');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
// Import the yt-search package.

const video720p = async (search) => {
  const getInfoVideo = await ytSearch(search);
  const url = getInfoVideo.videos[0].url;
  const title = getInfoVideo.videos[0].title;
  const videoUrl = url;
  const outputFilePath = title + '.mp4';

  const videoWriteStream = fs.createWriteStream('video.mp4');
  // fs.createWriteStream(outputFilePath);

  await new Promise((r, re) => {
    ytdl(videoUrl, { quality: 'lowestvideo' })
      .pipe(videoWriteStream)
      .on('finish', () => {
        r();
      })
      .on('error', (e) => {
        re(e);
      });
  });
  const audioStream = ytdl(videoUrl, { quality: 'lowestaudio' });

  const ffmpegProcess = spawn(ffmpeg, ['-i', 'video.mp4', '-i', 'pipe:0', '-c:v', 'copy', '-c:a', 'copy', '-strict', '-2', outputFilePath]);

  audioStream.pipe(ffmpegProcess.stdin);

  await new Promise((resolve, reject) => {
    ffmpegProcess.on('error', (err) => {
      console.error('Terjadi kesalahan saat menggunakan ffmpeg:', err);
      reject(err);
    });

    ffmpegProcess.on('close', () => {
      console.log('Penggabungan video dan audio selesai.');
      resolve(); // Resolve the Promise when ffmpeg process is completed.
    });
  });

  return title;
};

const audioonly = async (search) => {
  try {
    const getInfoVideo = await ytSearch(search);
    const url = getInfoVideo.videos[0].url;
    const title = getInfoVideo.videos[0].title;
    let info = await ytdl.getInfo(url);
    let format = ytdl.filterFormats(info.formats, 'audioonly');

    // download menggunakan url dari axios
    let format2 = format.filter((e) => e.container === 'mp4');
    // console.log(ytdl.getInfo(url).then((e) => console.log(e.formats)));

    const download = await ytdl(url, { quality: 'highestaudio' });
    console.log(download);
    await new Promise((resolve, reject) => {
      download
        .pipe(fs.createWriteStream(title + '.mp3'))
        .on('finish', () => {
          console.log('sudah');
          resolve();
        })
        .on('error', (e) => {
          reject(e);
        });
    });
    console.log('berhasil!');
    return title;
  } catch (e) {
    console.log(e);
  }
  //   const audioStream = await ytdl(videoUrl, { quality: 'highestaudio' });
  //   console.log('Formats with only audio: ' + format.length);
  //   console.log(format[1].url);
};
// const audioonly = async (search) => {
//   try {
//     const getInfoVideo = await ytSearch(search);
//     const url = getInfoVideo.videos[0].url;
//     const title = getInfoVideo.videos[0].title;
//     let info = await ytdl.getInfo(url);
//     let format = ytdl.filterFormats(info.formats, 'audioonly');

//     // download menggunakan url dari axios
//     let format2 = format.filter((e) => e.container === 'mp4');

//     const download = await axios.get(format2[0].url, { responseType: 'stream' });
//     await new Promise((resolve, reject) => {
//       download.data
//         .pipe(fs.createWriteStream(title + '.mp3'))
//         .on('finish', () => {
//           console.log('sudah');
//           resolve();
//         })
//         .on('error', (e) => {
//           reject(e);
//         });
//     });
//     console.log('berhasil!');
//   } catch (e) {
//     console.log(e);
//   }
//   //   const audioStream = await ytdl(videoUrl, { quality: 'highestaudio' });
//   //   console.log('Formats with only audio: ' + format.length);
//   //   console.log(format[1].url);
//   return title;
// };
// video720p('ya');
module.exports = { video720p, audioonly };
