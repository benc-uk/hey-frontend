var checker;

//
//
//
function clickGenerate() {  
  if(document.querySelector('#gen-section').style.display == 'inline')
    document.querySelector('#gen-section').style.display = 'none';
  else
    document.querySelector('#gen-section').style.display = 'inline';
}

//
//
//
function runGenerate() {
  req = {
    method: "POST",
    body: JSON.stringify({
      "params": document.querySelector('#gen-params').value,
      "url": document.querySelector('#gen-url').value
    }),
    headers: {
      "Content-Type": "application/json"
    }
  }

  fetch(`/api/run`, req)
  .then(resp => {
    if(resp.status == 400) { throw resp }
    if(!resp.ok) { throw Error(resp.statusText) }
    return resp.json()
  })
  .then(data => {
    //console.log(data);
    Toastify({
      text: "Load generation started!",
      duration: 3000,
      backgroundColor: "#2969aa"
    }).showToast();
    document.querySelector('#gen-section').style.display = 'none';
    checker = setInterval(checkStatus, 2000)
    document.querySelector('#generate').disabled = true;
    document.querySelector('#generate').innerHTML = '<i class="fas fa-running"></i> Running...'
  })
  .catch(async err => {
    if(err instanceof Response) {
      let j = await err.json()
      Toastify({
        text: j.msg,
        duration: 3000,
        backgroundColor: "#d67d3e"
      }).showToast();
    } else {
      alert(err)
    }
  })
}

//
//
//
function checkStatus() {
  fetch(`/api/run`)
  .then(resp => {
    return resp.json()
  })
  .then(data => {
    //console.log(`### ${data.running} ${data.code}`);

    if(!data.running) {
      document.querySelector('#generate').disabled = false;
      document.querySelector('#generate').innerHTML = '<i class="fas fa-chart-line"></i> Generate'
      if(data.code === 0) {
        if(checker) {
          refreshFiles()
          Toastify({
            text: "Job completed!",
            duration: 3000,
            backgroundColor: "#2969aa"
          }).showToast();
        }
      } else if(data.code > 0) {
        Toastify({
          text: "Load generation failed! Probably due to incorrect parameters",
          duration: 3000,
          backgroundColor: "#d67d3e"
        }).showToast();
      }
      clearInterval(checker)
    } else { //if(data.status == 'Running') {
      if(!checker) checker = setInterval(checkStatus, 2000)
      document.querySelector('#generate').disabled = true;
      document.querySelector('#generate').innerHTML = '<i class="fas fa-running"></i> Running...'      
    }
  })
  .catch(err => {
    alert(err)
  })
}

//
//
//
function refreshFiles() {
  fetch('/api/files')
  .then(resp => resp.json())
  .then(data => {
    // Remove old options except first
    let select = document.querySelector('#csvSelect');
    select.innerHTML = '<option value="" disabled selected="selected"> -- Select File -- </option>'
    // Add new options for each file
    for(let f of data.files) {
      option = document.createElement('option')
      option.value = f
      option.text = f.substring(0, f.length-4) // strip the extension
      select.add(option)
    }
  })
  .catch(err => {
    alert(err)
  })
}