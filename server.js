// Load .env file if it exists
require('dotenv').config()
const fs = require('fs')
const child_process = require('child_process');

const DATA_DIR = `${__dirname}/data/`
const SITE_DIR = `${__dirname}/site/`
const BIN_DIR  = `${__dirname}/bin/`

// Load in modules, and create Express app 
var express = require('express');
var app = express();
app.use(express.json());

// Serve the site
const dataDir = require('path').resolve(DATA_DIR)
if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir);
}
const siteDir = require('path').resolve(SITE_DIR)
const binDir = require('path').resolve(BIN_DIR)
app.use('/', express.static(siteDir));
app.use('/data', express.static(dataDir));

// Mini API for listing CSV files
app.get('/api/files', function (req, res) {
  let data = { files: [] };

  fs.readdirSync(dataDir).forEach(function(file) {
    if(!file.toLowerCase().endsWith('.csv')) return;
    data.files.push(file);
  });

  res.send(data);
});

var heyProcess
// API for running hey
app.post('/api/run', function (req, res) {
  if(heyProcess) { res.send({error:'Load generator already running'}); return; }
  
  let output = "";
  let params = req.body.params;
  let url = req.body.url;

  var urlParsed;
  try {
    const { URL } = require('url');
    urlParsed = new URL(url);
  } catch (error) {
    res.status(400).send({error:'URL is invalid'});
    return;
  }

  var date = new Date().toISOString();
  date = date.replace('T', ' ').replace(/\:/g, '.').substring(0, date.length-5)
  heyProcess = child_process.exec(`bin/hey -o csv ${params} ${url} > "${dataDir}/${urlParsed.hostname} ${date}.csv"`);
  console.log(`### Running: bin/hey -o csv ${params} ${url}`)

  heyProcess.stdout.on('data', (data) => {
    output += data
  });
  
  heyProcess.stderr.on('data', (data) => {
    console.error(`### Hey error: ${data}`);
    heyProcess = null
  });

  heyProcess.on('close', (code) => {
    console.log(`### Hey completed: ${code}`);
    heyProcess = null
  });

  res.send({msg:'Started'});
});

// API for getting process
app.get('/api/run', function (req, res) {
  if(heyProcess)
    res.send({pid: heyProcess.pid});
  else
    res.send({pid: null});
})

// Start the Express server
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  var port = server.address().port;
  console.log(`### Server listening on ${server.address().port}`);
});