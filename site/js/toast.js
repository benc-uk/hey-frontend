function launch_toast(msg) {
  var x = document.getElementById('toast')
  x.className = 'show'
  setTimeout(function () {
    x.className = x.className.replace('show', '')
  }, 5000)
}
