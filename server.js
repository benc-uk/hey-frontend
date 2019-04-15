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

var heyProcess = null;
var heyExitCode = -1;
var badData = false
// API for running hey
app.post('/api/run', function (req, res) {
  if(heyProcess) { res.status(400).send({msg:'Load generator already running'}); return; }
  
  let output = "";
  let paramString = req.body.params;
  let url = req.body.url;

  var urlParsed;
  try {
    const { URL } = require('url');
    urlParsed = new URL(url);
  } catch (error) {
    res.status(400).send({msg:'URL is invalid'});
    return;
  }

  let date = new Date().toISOString();
  date = date.replace('T', ' ').replace(/\:/g, '.').substring(0, date.length-5)

  let paramArray = []
  if(paramString.length > 0) paramArray.push(...paramString.split(" "))
  paramArray.push(...['-o', 'csv'])
  paramArray.push(url)
  heyExitCode = -1
  badData = false
  
  heyProcess = child_process.spawn('bin/hey', paramArray);
  console.log(`### Running: bin/hey ${paramString} -o csv ${url}`)

  var dataBlock = 0
  heyProcess.stdout.on('data', (data) => {
    // Check output for keywords that indicate we didn't get CSV response
    // The hey command isn't great at error checking, can't rely on exit code 
    
    let dataString = data.toString();
    //console.log("==== "+dataString.length+" "+dataBlock);
    if(dataString.includes('Summary:') || dataString.includes('Options:') || (dataBlock == 0 && dataString.length < 100)) {
      badData = true;
      return;
    } else {
      output += dataString
    }
    dataBlock++
  });
  
  heyProcess.stderr.on('data', (data) => {
    console.error(`### Hey error! ${data}`);
    heyProcess = null
  });

  heyProcess.on('error', (code) => {
    console.log(`### Hey exited with error: ${code}`);
    heyExitCode = code
    heyProcess = null
  });

  heyProcess.on('exit', (code) => {
    console.log(`### Hey completed: ${code} badData: ${badData}`);
    heyProcess = null
    if(badData) {
      heyExitCode = 70;
      return;
    }
    heyExitCode = code
    if(code === 0 && output.length > 0) fs.writeFileSync(`${dataDir}/${urlParsed.hostname} ${date}.csv`, output)
  });

  res.send({msg:'Started'});
});

// API for getting process status
app.get('/api/run', function (req, res) {
  if(!heyProcess) { res.send({running: false, code: heyExitCode}); return; }
  if(heyProcess) { res.send({running: true, code: heyExitCode}); return; }
})

// Start the Express server
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  var port = server.address().port;
  console.log(`### Server is listening on ${server.address().port}`);
});