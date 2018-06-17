const Nightmare = require('nightmare')
const nightmare = Nightmare({
  electronPath: require('electron'),
  // openDevTools: {
  //   mode: 'detach'
  // },
  waitTimeout: 60000,
  show: true,
  typeInterval: 300,
  webPreferences: {
    webSecurity: false,
    allowRunningInsecureContent: true,
    plugins: true,
    experimentalFeatures: true
  }
})

nightmare
  .goto('https://app.napster.com/login/')
  .wait('.signin')
  .type('#username', 'fxl59948@mziqo.com')
  .type('#password', 'fxl59948@mziqo.com')
  .click('.signin')
  .wait('.nav-search-button')
  // .goto('https://app.napster.com/artist/micro-beats-and-breaks/album/first-trial')
  .goto('https://app.napster.com/artist/yokem/album/boombeats')
  .wait('.track-list-header .shuffle-button')
  .click('.track-list-header .shuffle-button')
  .wait('#endless-switch')
  .click('#endless-switch')
  .catch()

setInterval(() => {
  nightmare
    .goto('https://app.napster.com/artist/yokem/album/boombeats')
    .wait('.track-list-header .shuffle-button')
    .click('.track-list-header .shuffle-button')
}, 1000 * 60 * 5);