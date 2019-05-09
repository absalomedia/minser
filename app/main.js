const {app, Menu, Tray, BrowserWindow, ipcMain, shell, nativeImage, dialog} = require('electron')
const remote = require('electron').remote
const i18next = require('i18next')
const Backend = require('i18next-node-fs-backend')
let VersionChecker = require('./utils/versionChecker')
const log = require('electron-log')
const path = require('path')
const shellPath = require('shell-path')
const command = require('shelljs/global')
const fs = require('fs')
const proc = require('child_process')

if (process.platform === 'win32') {
/*
const autoUpdater = require('electron')
const server = 'hazel-server-nzhfigowai.now.sh'
const feed = `${server}/update/${process.platform}/${app.getVersion()}`
autoUpdater.setFeedURL(feed)
*/
}
	
startI18next()

log.transports.file.level = 'silly'
log.transports.console.level = 'silly'

const AppSettings = require('./utils/settings')
const defaultSettings = require('./utils/defaultSettings')
const jquery = require('jquery')
process.env.PATH = shellPath.sync()

function getIcon(path_icon) {
    return nativeImage.createFromPath(path_icon).resize({width: 16})
}

const trayActive = getIcon(path.join(__dirname,'assets/logo/trayIcon.png'))
const trayWait = getIcon(path.join(__dirname,'assets/logo/trayIconWait.png'))
const icon = path.join(__dirname,'/assets/logo/windowIcon.png')
const gotTheLock = app.requestSingleInstanceLock()

let aboutUs = null
let appIcon = null
let aboutWin = null
let tray = null
let settingsWin = null
let settings
var contextMenu 

global.shared = {
	isNewVersion: false
  }

if (!gotTheLock) {
		log.info('Minser is already running.')
		app.quit()
} else {
		app.on('second-instance', (event, commandLine, workingDirectory) => {
			if (appIcon) {
				dialog.showMessageBox({
					buttons: [i18next.t('main.yes')],
					message: 'Already running'
				})
			}
		})
}
	
if(process.platform === 'darwin') {
    app.dock.hide()
}

function startI18next() {
	i18next
	  .use(Backend)
	  .init({
		lng: 'en',
		fallbackLng: 'en',
		debug: true,
		backend: {
		  loadPath: path.join(__dirname, '/locales/{{lng}}.json'),
		  jsonIndent: 2
		}
	  }, function (err, t) {
		if (err) {
			log.error(err.stack)
			errorBox('i18',err.stack)
		}
		if (appIcon) {
		  buildMenu()
			}
	  })
  }
  
  i18next.on('languageChanged', function (lng) {
	if (appIcon) {
	  buildMenu()
	}
  })


  function startPowerMonitoring () {
	const electron = require('electron')
	electron.powerMonitor.on('suspend', () => {
		log.info('The system is going to sleep')
	})
	electron.powerMonitor.on('resume', () => {
		log.info('The system is resuming')
	})
	}
	
	function winStyle(title) {
		window = new BrowserWindow({
		 width : 400,
		 height : 600,
		 resizable : false,
		 fullscreen : false,
		 frame: false,
		 titleBarStyle: 'customButtonsOnHover',		
		 icon : icon,
		 title: i18next.t(title)
	 })
	 return window 
 }

  function showAboutWindow () {
	if (aboutWin) {
	  aboutWin.show()
	  return
	}
	const modalPath = 'about.html'
	aboutWin = winStyle('main.aboutVM', {version: app.getVersion()})
	aboutWin.loadFile(modalPath)
	aboutWin.on('closed', () => {
	  aboutWin = null
	})
	}
	
function showSettingsWindow () {
  if (settingsWin) {
    settingsWin.show()
    return
  }
  const modalPath = 'settings.html'
  settingsWin = winStyle('main.settings')
  settingsWin.loadFile(modalPath)
  settingsWin.on('closed', () => {
    settingsWin = null
  })
}

function showConvertWindow () {
	if (conWin) {
	  conWin.show()
	  return
	}
	const modalPath = 'convert.html'
	conWin = winStyle('main.aboutVM', {version: app.getVersion()})
	conWin.loadFile(modalPath)
	conWin.on('closed', () => {
	  conWin = null
	})
	}


function saveDefaultsFor (array, next) {
  for (let index in array) {
    settings.set(array[index], defaultSettings[array[index]])
  }
}

function errorBox(code,stderr) 
{
	dialog.showMessageBox({
		type: 'error',
		buttons: [i18next.t('main.yes')],
		message: 'Code ' + code,
		detail : stderr
	})
}

function sept() 
{
	var text  = {
					type: 'separator'
				}
	return text
}

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
}

function buildTray() {
	tray = new Tray(trayActive)
	return tray
}

function buildMenu() {
	let menu = []
	
	if (global.shared.isNewVersion) {
		menu.push({
		label: i18next.t('main.downloadLatest'),
		click: function () {
			downloadLatestUpdate()
			}
		})
	}
		menu.push(
		sept(),
		{
			label: i18next.t('main.settings'),
			click: function ()
			{
				showSettingsWindow()
			}
		},
		{
			label: i18next.t('main.convert'),
			click: function ()
			{
				showConvertWindow()
			}
		},		
		{
			label: i18next.t('main.about'),
			click: function ()
			{
				showAboutWindow()
			}
		})	

		if (process.platform === 'darwin' || process.platform === 'win32') {
			let loginItemSettings = app.getLoginItemSettings()
			let openAtLogin = loginItemSettings.openAtLogin
			menu.push({
				label: i18next.t('main.startAtLogin'),
				type: 'checkbox',
				checked: openAtLogin,
				click: function () {
				app.setLoginItemSettings({openAtLogin: !openAtLogin})
				}
			})
		}

		menu.push(
			{
				label: i18next.t('main.quit'),
				click: function (menuItem)
				{
						app.quit()
				}
			})

		contextMenu = Menu.buildFromTemplate(menu)
		tray.setToolTip(i18next.t('main.header'))
		tray.setContextMenu(contextMenu)
		return contextMenu
}

app.on('ready', loadSettings)
app.on('ready', buildTray)
app.on('ready', startPowerMonitoring)
app.on('window-all-closed', () => {
  // do nothing, so app wont get closed
})
app.on('ready', buildMenu)

app.on('before-quit', () => {
})

function loadSettings () {
	const dir = app.getPath('userData')
	const settingsFile = '${dir}/config.json'
	settings = new AppSettings(settingsFile)
	i18next.changeLanguage(settings.get('language'))
}

ipcMain.on('save-setting', function (event, key, value) {
  settings.set(key, value)
  settingsWin.webContents.send('renderSettings', settings.data)
  buildMenu()
})

ipcMain.on('update-tray', function (event) {
	buildMenu()
})

ipcMain.on('set-default-settings', function (event, data) {
  const options = {
    type: 'info',
    title: i18next.t('main.resetToDefaults'),
    message: i18next.t('main.areYouSure'),
    buttons: [i18next.t('main.yes'), i18next.t('main.no')]
  }
  dialog.showMessageBox(options, function (index) {
    if (index === 0) {
      saveDefaultsFor(data)
      settingsWin.webContents.send('renderSettings', settings.data)
    }
  })
})

ipcMain.on('send-settings', function (event) {
  settingsWin.webContents.send('renderSettings', settings.data)
})

ipcMain.on('show-debug', function (event) {
  const dir = app.getPath('userData')
  const settingsFile = `${dir}/config.json`
  aboutWin.webContents.send('debugInfo', settingsFile)
})

ipcMain.on('change-language', function (event, language) {
  i18next.changeLanguage(language)
  if (settingsWin) {
    settingsWin.webContents.send('renderSettings', settings.data)
  }
})
