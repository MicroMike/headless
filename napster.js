const fs = require('fs');
let accounts = []
let accountsValid = []
let over = false
let albums

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
  fs.writeFile('napsterAccount.txt', accountsValid.concat(accounts).join(','), function (err) {
    if (err) return console.log(err);
  });
}

const push = (arr, item) => {
  arr = arr.filter(a => a !== item)
  arr.push(item)
}

const main = async (restartAccount, persist) => {
  if (over) { return }
  if (!restartAccount) {
    console.log(accountsValid.length)
    if (accountsValid.length >= accounts.length || accountsValid.length >= 30) { return }
  }
  let session = persist || 'persist: ' + Date.now()
  let account = restartAccount || accounts.shift()
  let inter

  accountInfo = account.split(':')
  const player = accountInfo[0]
  const login = accountInfo[1]
  const pass = accountInfo[2]
  const logged = accountInfo[3] || null

  // account += !logged ? ':' + session : ''

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

  let inputs = {
    username: '#username',
    password: '#password'
  }
  let url
  let loginBtn
  let playBtn
  let shuffle

  let errorLog = false
  let connected = false

  try {

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

    if (!persist) {
      if (logged) {
        connected = await nightmare
          .goto(album())
          .wait(4000 + rand(2000))
          .evaluate(() => {
            return document.querySelector('.track-list-header .shuffle-button')
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
            !document.querySelector('.track-list-header .shuffle-button')
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

    push(accountsValid, account)
    save()

    if (!restartAccount) {
      main()
    }

    if (check) {
      await nightmare.end()
    }
    else {
      let inter = setInterval(async () => {
        try {
          if (over) { return clearInterval(inter) }
          await nightmare
            .goto(album())
            .wait(2000 + rand(2000))
            .click(playBtn)
            .wait(2000 + rand(2000))
            .click(shuffle)
            .then()
            .catch(async (e) => {
              console.log('catch album' + e)
              clearInterval(inter)
              errorLog = true
            })

          if (errorLog) { throw 'reconnect' }
        }
        catch (e) {
          accountsValid = accountsValid.filter(a => a !== account)
          save()

          if (e === 'reconnect') {
            console.log("ERROR reco ", login, e)
            main(account)
          }
        }
      }, 1000 * 60 * (2 + rand(8)));
      // let time = setTimeout(async () => {
      //   if (over) { return clearInterval(time) }
      //   clearInterval(inter)
      //   await nightmare.end(() => {
      //     main(account)
      //   })
      // }, 1000 * 60 * (15 + rand(15)));
    }
  }
  catch (e) {
    await nightmare.end(() => {
      accountsValid = accountsValid.filter(a => a !== account)
      save()

      if (e === 'out') {
        console.log("ERROR ", login, e)
        main(account)
      }

      if (!restartAccount) {
        main()
      }
    })
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