const {ipcRenderer} = require('electron')
const HtmlTranslate = require('./utils/htmlTranslate')

document.addEventListener('DOMContentLoaded', event => {
  new HtmlTranslate(document).translate()
})

let eventsAttached = false
ipcRenderer.send('send-settings')

document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())

ipcRenderer.on('renderSettings', (event, data) => {
  let enableElements = document.getElementsByClassName('enable')
  for (var i = 0; i < enableElements.length; i++) {
    let element = enableElements[i]
    element.checked = data[element.value]
    if (!eventsAttached) {
      element.addEventListener('click', function (e) {
        ipcRenderer.send('save-setting', element.value, element.checked)
      })
    }
  }

  document.getElementById('language').value = data['language']
  document.getElementById('key').value = data['key']
  eventsAttached = true
})

document.getElementById('defaults').addEventListener('click', function (e) {
  ipcRenderer.send('set-default-settings', [])
})

document.getElementById('key').addEventListener('change', function (e) {
  ipcRenderer.send('save-setting', 'key', e.target.value)
  window.location.reload()
})

document.getElementById('language').addEventListener('change', function (e) {
  ipcRenderer.send('change-language', e.target.value)
  ipcRenderer.send('save-setting', 'language', e.target.value)
  window.location.reload()
})

document.getElementById('close-btn').addEventListener('click', function (e) {
  window.close()
})