var checker;

function clickGenerate() {
  req = {
    method: "POST",
    body: JSON.stringify({
      "params": "-z 20s -c 100",
      "url": "https://www.royalacademyofdance.org/"
    }),
    headers: {
      "Content-Type": "application/json"
    }
  }

  fetch(`/api/run`, req)
  .then(resp => {
    if (!resp.ok) { throw Error(resp.statusText) }
    return resp.json()
  })
  .then(data => {
    //console.log(data);
    checker = setInterval(checkStatus, 2000)
    document.querySelector('#generate').disabled = true;
    document.querySelector('#generate').innerHTML = '<i class="fas fa-running"></i> Running...'
  })
  .catch(err => {
    alert(err)
  })
}

function checkStatus() {
  fetch(`/api/run`)
  .then(resp => {
    return resp.json()
  })
  .then(data => {
    //console.log(data.pid);
    if(data.pid == null) {
      refreshFiles()
      document.querySelector('#generate').disabled = false;
      document.querySelector('#generate').innerHTML = '<i class="fas fa-chart-line"></i> Generate'
      clearInterval(checker)
    }
  })
  .catch(err => {
    alert(err)
  })
}

function refreshFiles() {
  fetch('/api/files')
  .then(resp => resp.json())
  .then(data => {
    let select = document.querySelector('#csvSelect');
    for (var i = 1; i < select.length; i++){
      select.remove(i);
    }
    for(let f of data.files) {
      option = document.createElement('option')
      option.value = f
      option.text = f.substring(0, f.length-4)
      select.add(option)
    }
  })
  .catch(err => {
    alert(err)
  })
}