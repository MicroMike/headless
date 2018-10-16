const fs = require('fs');
let accounts = []
let over = false
let albums

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const album = () => albums[rand(albums.length)]

const main = async (restartAccount) => {
  if (over) { return }
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
    ]
    playBtn = '.track-list-header .shuffle-button'
    shuffle = '.repeat-button'


    if (!restartAccount) {
      await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .click(loginBtn)
        .wait(2000 + rand(2000))
    }

    const unradio = await nightmare
      .goto(album())
      .wait(2000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.unradio').text() || document.querySelector('.account-issue').text() || document.querySelector('.single-stream-error').text()
      })

    if (unradio) {
      throw 'getout';
    }

    let errorLog = false

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
        main()
      })

    if (errorLog) { return }

    accounts.push(account)
    fs.writeFile('napsterAccount.txt', accounts.join(','), function (err) {
      if (err) return console.log(err);
    });

    setTimeout(async () => {
      await nightmare.end()
      main(account)
    }, 1000 * 60 * 15);

    if (accounts.length && !restartAccount) {
      main()
    }
  }
  catch (e) {
    console.log("error", account, e)
    fs.writeFile('napsterAccount.txt', accounts.join(','), function (err) {
      if (err) return console.log(err);
    });
  }
}

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  main()
});

process.on('SIGINT', function (code) {
  over = true
});