const fs = require('fs');
let accounts = []
let over = false
let albums
let count = 0

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

const main = async (restartAccount) => {
  if (over) { return }
  if (count >= accounts.length) { return }
  count = !restartAccount ? count + 1 : count;
  let account = restartAccount || accounts.shift()
  let inter
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
      // partition: persist,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      images: false,
      experimentalFeatures: true
    }
  })

  accountInfo = account.split(':')
  const player = accountInfo[0]
  const login = accountInfo[1]
  const pass = accountInfo[2]

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

    // if (!restartAccount) {
    await nightmare
      .goto(url)
      .wait(2000 + rand(2000))
      .type(inputs.username, login)
      .type(inputs.password, pass)
      .click(loginBtn)
      .wait(2000 + rand(2000))
      .then()
      .catch(async (e) => {
        console.log('catch login')
        await nightmare.end()
        errorLog = true
        setTimeout(() => {
          main(account)
        }, 1000);
      })
    // }

    if (errorLog) { return save() }

    const unradio = await nightmare
      .goto(album())
      .wait(2000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.unradio') && document.querySelector('.unradio').innerHTML ||
          document.querySelector('.account-issue') && document.querySelector('.account-issue').innerHTML
      })
      .then()
      .catch(async (e) => {
        console.log('catch account type' + e)
        await nightmare.end()
        errorLog = true
        setTimeout(() => {
          main(account)
        }, 1000);
      })

    if (errorLog) { return save() }

    if (unradio) {
      await nightmare.end()
      save()
      main()
      return
    }

    const used = await nightmare
      .wait(2000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.single-stream-error') && document.querySelector('.single-stream-error').innerHTML
      })

    if (used) {
      await nightmare.end()
      accounts.push(account)
      setTimeout(() => {
        main(account)
      }, 1000 * 60 * 15);
      return
    }

    await nightmare
      .wait(2000 + rand(2000))
      .click(playBtn)
      .wait(2000 + rand(2000))
      .click(shuffle)
      .then()
      .catch(async (e) => {
        console.log('catch album')
        await nightmare.end()
        errorLog = true
        setTimeout(() => {
          main()
        }, 1000);
      })

    if (errorLog) { return save() }

    accounts.push(account)
    save()

    main()

    setTimeout(async () => {
      await nightmare.end()
      main(account)
    }, 1000 * 60 * 15);
  }
  catch (e) {
    console.log("error", account, e)
    main(account)
    // fs.writeFile('napsterAccount.txt', accounts.join(','), function (err) {
    //   if (err) return console.log(err);
    // });
  }
}

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  shuffle(data)
  accounts = data.split(',')
  console.log(accounts.length)
  main()
});

process.on('SIGINT', function (code) {
  over = true
});