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

  ytdl(videoUrl, { quality: 'highestvideo' })
    .pipe(videoWriteStream)
    .on('finish', () => {
      const audioStream = ytdl(videoUrl, { quality: 'highestaudio' });

      const ffmpegProcess = spawn(ffmpeg, ['-i', 'video.mp4', '-i', 'pipe:0', '-c:v', 'copy', '-c:a', 'copy', '-strict', '-2', outputFilePath]);

      audioStream.pipe(ffmpegProcess.stdin);

      ffmpegProcess.on('error', (err) => {
        console.error('Terjadi kesalahan saat menggunakan ffmpeg:', err);
      });

      ffmpegProcess.on('close', () => {
        console.log('Penggabungan video dan audio selesai.');
        fs.unlinkSync('video.mp4');
      });
    })
    .on('error', (err) => {
      console.error('Terjadi kesalahan saat mengunduh video:', err);
    });
  return title;
};

const audioonly = async (search) => {
  const getInfoVideo = await ytSearch(search);
  const url = getInfoVideo.videos[0].url;
  const title = getInfoVideo.videos[0].title;
  let info = await ytdl.getInfo(url);
  let format = ytdl.filterFormats(info.formats, 'audioonly');

  // download menggunakan url dari axios
  let format2 = format.filter((e) => e.container === 'mp4');
  console.log(format2);
  try {
    const download = await axios.get(format2[0].url, { responseType: 'stream' });
    // download.data.pipe(fs.createWriteStream('music/' + title + '.mp4a'));
    console.log('result:', download);
  } catch (e) {
    console.log(e);
  }
  //   const audioStream = await ytdl(videoUrl, { quality: 'highestaudio' });
  //   console.log('Formats with only audio: ' + format.length);
  //   console.log(format[1].url);
  return format;
};

module.exports = { audioonly, video720p };
