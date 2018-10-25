const fs = require('fs');
let accounts = []
let over = false
let albums
let count = 0

const check = process.env.CHECK

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const album = () => albums[rand(albums.length)]

const save = () => {
  fs.writeFile('napsterAccount.txt', accounts.join(','), function (err) {
    if (err) return console.log(err);
  });
}

const main = async (restartAccount, persist) => {
  if (over) { return }
  if (count >= accounts.length) { return }
  count = !restartAccount ? count + 1 : count
  let session = persist || 'persist: ' + Date.now()
  let account = restartAccount || accounts.shift()
  let inter

  accountInfo = account.split(':')
  const player = accountInfo[0]
  const login = accountInfo[1]
  const pass = accountInfo[2]
  const logged = accountInfo[3] || null

  account += !logged ? ':' + session : ''

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 60,
    show: true,
    typeInterval: 300,
    webPreferences: {
      partition: logged || session,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      images: false,
      experimentalFeatures: true
    }
  })

  try {
    let inputs = {
      username: '#username',
      password: '#password'
    }
    let url
    let loginBtn
    let playBtn
    let shuffle

    url = 'https://app.napster.com/login/'
    loginBtn = '.signin'
    albums = [
      'https://app.napster.com/artist/honey/album/just-another-emotion',
      'https://app.napster.com/artist/yokem/album/boombeats',
      'https://app.napster.com/artist/hanke/album/new-york-story',
      'https://app.napster.com/artist/hanke/album/100-revenge',
      'https://app.napster.com/artist/yonne/album/loser'
    ]
    playBtn = '.track-list-header .shuffle-button'
    shuffle = '.repeat-button'

    let errorLog = false
    let connected = false

    if (!persist) {
      if (logged) {
        connected = await nightmare
          .goto(album())
          .wait(4000 + rand(2000))
          .evaluate(() => {
            return document.querySelector(playBtn)
              && !document.querySelector('.unradio')
              && !document.querySelector('.account-issue')
          })
          .then()
          .catch(async (e) => {
            console.log('catch logged' + e)
            errorLog = true
          })
      }

      if (errorLog) { throw 'out' }

      if (!connected) {
        await nightmare
          .goto(url)
          .wait(2000 + rand(2000))
          .type(inputs.username, login)
          .type(inputs.password, pass)
          .wait(2000 + rand(2000))
          .click(loginBtn)
          .wait(4000 + rand(2000))
          .then()
          .catch(async (e) => {
            console.log('catch login' + e)
            errorLog = true
          })

        if (errorLog) { throw 'out' }
      }
    }

    if (!connected) {
      const issue = await nightmare
        .goto(album())
        .wait(2000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('.unradio') && document.querySelector('.unradio').innerHTML ||
            document.querySelector('.account-issue') && document.querySelector('.account-issue').innerHTML ||
            !document.querySelector(playBtn)
        })
        .then()
        .catch(async (e) => {
          console.log('catch account type' + e)
          errorLog = true
        })

      if (errorLog) { throw 'out' }

      if (issue) {
        console.log('out issue')
        throw 'del'
      }
    }

    if (!restartAccount) {
      main()
    }

    const used = await nightmare
      .wait(2000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.single-stream-error') && document.querySelector('.single-stream-error').innerHTML
      })

    if (used) {
      console.log('out used')
      throw 'out'
    }

    await nightmare
      .wait(2000 + rand(2000))
      .click(playBtn)
      .wait(2000 + rand(2000))
      .click(shuffle)
      .then()
      .catch(async (e) => {
        console.log('catch album' + e)
        errorLog = true
      })

    if (errorLog) { throw 'out' }

    accounts.push(account)
    save()

    if (!restartAccount) {
      main()
    }

    if (check) {
      await nightmare.end()
    }
    else {
      setTimeout(async () => {
        await nightmare.end(() => {
          main(account)
        })
      }, 1000 * 60 * (15 + rand(15)));
    }
  }
  catch (e) {
    console.log("ERROR ", account, e)

    if (e === 'out') {
      accounts.push(account)
    }
    save()

    if (!restartAccount) {
      main()
    }
  }
}

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  // shuffle(data)
  accounts = data.split(',')
  console.log(accounts.length)
  main()
});

process.on('SIGINT', function (code) {
  over = true
});