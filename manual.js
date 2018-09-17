const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const main = async (session) => {
  const persist = session || 'persist: ' + Date.now()
  let inter
  let interloop
  let inputs = {
    username: 'form input[name="username"]',
    password: 'form input[name="password"]'
  }
  let url = 'https://accounts.spotify.com/login'
  let loginBtn = '#login-button'
  let playBtn = '.tracklist-play-pause.tracklist-middle-align'
  let change = 0
  let pause = rand(4) + 2

  let month = rand(12) + 1
  month = month < 10 ? '0' + month : '' + month

  let player
  let login
  let pass

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 60 * 5,
    show: true,
    width: 600,
    height: 600,
    typeInterval: 300,
    webPreferences: {
      partition: persist,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      experimentalFeatures: true
    }
  })

  if (!session) {
    const account = await nightmare
      .goto('https://www.tempmailaddress.com')
      .wait(2000)
      .evaluate(() => {
        let email = document.getElementById('email').innerText
        return 'spotify:' + email + ':' + email
      })
      .then()
      .catch((e) => {
        nightmare.end()
        main(persist)
      })

    accountInfo = account.split(':')
    player = accountInfo[0]
    login = accountInfo[1]
    pass = accountInfo[2]

    const urlactivate = await nightmare
      .goto('https://spotify.com/signup')
      .wait('#register-email')
      .type('#register-email', login)
      .type('#register-confirm-email', login)
      .type('#register-password', login)
      .type('#register-displayname', login.split('@')[0])
      .type('#register-dob-day', rand(25) + 1)
      .select('#register-dob-month', month)
      .type('#register-dob-year', rand(32) + 1963)
      .click('#register-' + (rand(2) ? 'male' : 'female'))
      .wait('.logout-link')
      .wait(2000 + rand(2000))
      .goto('https://www.tempmailaddress.com')
      .wait('#schranka tr.hidden-md[data-href="2"]')
      .goto('https://www.tempmailaddress.com/email/id/2')
      .forward()
      .goto('https://www.tempmailaddress.com/email/id/2')
      .forward()
      .wait('.call-to-action-button')
      .evaluate(() => {
        return document.getElementsByClassName('call-to-action-button')[0].href;
      })
      .then()
      .catch((e) => {
        nightmare.end()
        main(persist)
      })

    await nightmare
      .goto(urlactivate)
      .wait(2000 + rand(2000))

    // main()
  }

  await nightmare
    .goto('https://open.spotify.com/playlist/2d64R3iEY5cCDwTmLt9bwr')
    .wait(2000 + rand(2000))
    .wait('.tracklist-top-align')
    .click('.tracklist-top-align')
    .wait(2000 + rand(2000))
    .evaluate(() => {
      setTimeout(() => {
        let shuffle = '.spoticon-shuffle-16:not(.control-button--active)'
        document.querySelector(shuffle) && document.querySelector(shuffle).click()
      }, 1000);

      setTimeout(() => {
        let repeat = '.spoticon-repeat-16:not(.control-button--active)'
        document.querySelector(repeat) && document.querySelector(repeat).click()
      }, 2000);

      return true
    })
    .then()
    .catch((e) => {
      nightmare.end()
      main(persist)
    })

  setTimeout(() => {
    nightmare.end()
    main(persist)
  }, 1000 * 60 * 10);

}

try {
  main()
}
catch (e) {
  console.log('catch')
  main()
}
