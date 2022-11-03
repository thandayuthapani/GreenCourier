

const args = process.argv;
const MARIADB = args[2];
process.env.MARIADB = MARIADB;

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

const { consoleLog } = require('./utils/express_utils');

async function main(){
  await require('./initializations').initializations();

  const port = process.env.PORT || 3000;

  const app = express();
  console.disableYellowBox = true;
  app.use(express.static('public'));

  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api/', routes);

  app.get('*', function (request, response) {
    response.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });

  const server = app.listen(port, () => {
    consoleLog('app.js', 'main', 'listen', `Server is listening on port ${port}`);
  });

  server.setTimeout(15*60*1000);
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
