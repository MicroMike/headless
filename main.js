// Modules to control application life and create native browser window
const path = require('path')
const { app, BrowserWindow } = require('electron')
const widevine = require('electron-widevinecdm');
var request = require('ajax-request');

widevine.load(app);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
      partition: 'M!cr0',
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
    },
    width: 800, height: 600
  })

  // and load the index.html of the app.
  mainWindow.loadURL('https://spotify.com')
  // THIS WORKS!!!
  mainWindow.webContents.executeJavaScript(`
    var emails = [
      'westyn.dayson@0live.org',
      'juanmiguel.rylyn@0live.org',
      'makoto.charlee@0live.org',
      'savva.tyrion@0live.org',
      'giulio.dexton@0live.org',
      'gennaro.legacy@0live.org',
      'tao.tariq@0live.org',
      'srihan.naman@0live.org',
      'dalan.javaughn@0live.org',
      'tavish.edisson@0live.org',
      'lycan.chaz@0live.org',
      'khade.jewel@0live.org',
      'kunga.kelby@0live.org',
      'xzavian.kael@0live.org',
      'nash.kristofer@0live.org',
      'belal.khang@0live.org',
      'keontre.toki@0live.org',
      'jontrell.darcy@0live.org',
      'ermias.paris@0ils.net',
      'aasim.oluwatomiwa@ldaho.net',
      'frederic.raihan@ldaho.net',
      'kensington.alvis@ldaho.net',
      'marlow.novah@ldaho.net',
      'reynold.donnie@ldaho.net',
      'marlow.novah@ldaho.net',
      'reynold.donnie@ldaho.net',
      'jahkye.osbourne@ldaho.net',
      'kayse.zhaire@ldaho.net',
      'taran.gardner@ldaho.net',
      'akari.kohl@ldaho.net',
      'imaan.mattox@ldaho.net',
      'akari.kohl@ldaho.net',
      'kayse.zhaire@ldaho.net',
      'imaan.mattox@ldaho.net',
      'taran.gardner@ldaho.net',
      'roland.avondre@ldaho.net',
      'master.mantra@ldaho.net',
      'ephriam.azarias@ldaho.net',
      'chelsea.kennett@ldaho.net',
      'huzaifa.brendyn@ldaho.net',
      'master.mantra@ldaho.net',
      'huzaifa.brendyn@ldaho.net',
      'ephriam.azarias@ldaho.net',
      'roland.avondre@ldaho.net',
      'elder.suyash@ldaho.net',
      'sofian.emari@ldaho.net',
      'tyris.phoenixx@ldaho.net',
      'reif.jaiceon@ldaho.net',
      'elder.suyash@ldaho.net',
      'rayon.trek@ldaho.net',
      'reif.jaiceon@ldaho.net',
      'tyris.phoenixx@ldaho.net',
      'sofian.emari@ldaho.net',
      'brenner.hailey@ldaho.net',
      'rally.zailyn@ldaho.net',
      'rally.zailyn@ldaho.net',
      'qian.artavious@ldaho.net',
      'justin.kees@ldaho.net',
      'brenner.hailey@ldaho.net',
      'justin.kees@ldaho.net',
      'qian.artavious@ldaho.net',
      'yeshaya.abraham@ldaho.net',
      'julien.chadrick@ldaho.net',
      'mercy.aalijah@ldaho.net',
      'kaos.ulices@ldaho.net',
      'brodrick.draven@ldaho.net',
      'julien.chadrick@ldaho.net',
      'yeshaya.abraham@ldaho.net',
      'mercy.aalijah@ldaho.net',
      'brodrick.draven@ldaho.net',
      'brentyn.manav@ldaho.net',
      'zebulon.preslee@ldaho.net',
      'lukah.samik@ldaho.net',
      'rayne.arin@ldaho.net',
      'riker.oleg@ldaho.net',
      'zebulon.preslee@ldaho.net',
      'riker.oleg@ldaho.net',
      'rayne.arin@ldaho.net',
      'lukah.samik@ldaho.net',
      'damiano.bob@ldaho.net',
      'mizael.lofton@ldaho.net',
      'cort.tenzing@ldaho.net',
      'damiano.bob@ldaho.net',
      'angelito.harfateh@ldaho.net',
      'mizael.lofton@ldaho.net',
      'eyoel.emin@ldaho.net',
      'angelito.harfateh@ldaho.net',
      'eyoel.emin@ldaho.net',
      'wheeler.niklas@ldaho.net',
      'muhammad.severiano@ldaho.net',
      'rajveer.prynceton@ldaho.net',
      'syair.kengo@ldaho.net',
      'wheeler.niklas@ldaho.net',
      'muhammad.severiano@ldaho.net',
      'rajveer.prynceton@ldaho.net',
      'richy.aun@ldaho.net',
      'nolen.haston@ldaho.net',
      'brantson.degan@ldaho.net',
      'richy.aun@ldaho.net',
      'brantson.degan@ldaho.net',
      'jotaro.xiomar@ldaho.net',
      'nolen.haston@ldaho.net',
      'russell.kyriee@ldaho.net',
      'jotaro.xiomar@ldaho.net',
      'russell.kyriee@ldaho.net',
    ]

    function getRandomInt(max, min) {
      return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 1));
    }

    var month = getRandomInt(12)
    month = month < 10 ? '0' + month : '' + month

    var url = (newAccount) => (newAccount ? 'https://spotify.com/fr/signup' : 'https://accounts.spotify.com/fr/login');

    var artists = [
      'artist/4fjzml1NOgcHdsmJM00i7a',
      'artist/5WuAJTOU9cvpenk1t5CyJM',
      'artist/5c8MuSvGUcVLTRmjMmg3OO',
      'album/0hf0fEpwluYYWwV1OoCWGX',
      'album/5ceAg32Kt8ta6U7qWYPesW',
      'album/3FJdPTLyJVPYMqQQUyb6lr',
      'album/6vvfbzMU2dkFQRJiP99RS4',
    ]

    var oneHour = 3600000;
    var interval = getRandomInt(720000, 480000)
    var intervalHours = getRandomInt(oneHour * 3, oneHour * 1.5)

    var yn70 = () => (getRandomInt(10, 1) > 7 ? true : false)

    const isNew = yn70()
    const tempmaillist = [
      'https://www.tempmailaddress.com',
      'https://www.tempmailaddress.com',
      // 'https://www.mohmal.com/fr/create/random',
      // 'https://www.crazymailing.com',
    ]
    
    var emailurl = tempmaillist[getRandomInt(tempmaillist.length, 0)]
var tempmail

    if (isNew) {
      window.location = (emailurl)

      switch (emailurl) {
        case 'https://www.mohmal.com/fr/create/random':
          tempmail = $('[data-email]').attr('data-email')
        case 'https://www.crazymailing.com':
          tempmail = document.getElementById('email_addr').innerText
        case 'https://www.tempmailaddress.com':
          tempmail = document.getElementById('email').innerText
      }
    }
    else {
      tempmail = emails[getRandomInt(emails.length, 0)]
    }

    console.log('\x1b[33m%s\x1b[0m', 'load: ' + tempmail)

    setTimeout(async () => {
      anticaptcha(isNew, tempmail);
      // twocaptcha(isNew);
      // create(true)
    }, getRandomInt(180000));
    `)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.