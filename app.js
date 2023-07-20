const express = require('express');
const bot = require('./index');
const app = express();
const port = 3000;
const mustacheExpress = require('mustache-express');

let server;

app.set('view engine', 'html');
app.engine('html', mustacheExpress());
app.get('/', (req, res) => {
  console.log(req.ip);
  res.render('index');
});

app.get('/shutdown', (req, res) => {
  console.log('Mematikan server...');
  res.send('Server dimatikan');
  process.exit(10);
  server.close(() => {
    console.log('Server sudah dimatikan');
  });
});

server = app.listen(port, async () => {
  const hostname = server.address().address;
  console.log(`Example app listening on port ${this}:${port}`);
});
console.log(server);

// bot().catch((e) => {
//   console.log(e);
// });
