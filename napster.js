const fs = require('fs');
let accounts = []

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const main = async (restartAccount) => {
  setTimeout(async () => {
    let account = restartAccount || accounts.shift()
    let inter
    const Nightmare = require('nightmare')
    const nightmare = Nightmare({
      electronPath: require('electron'),
      // openDevTools: {
      //   mode: 'detach'
      // },
      alwaysOnTop: false,
      waitTimeout: 10000,
      show: false,
      typeInterval: 300,
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
        plugins: true,
        experimentalFeatures: true
      }
    })

    const push = (e) => {
      if (e !== 'getout' && accounts.indexOf(account) < 0) {
        accounts.push(account)
      }
    }

    accountInfo = account.split(':')
    const player = accountInfo[0]
    const login = accountInfo[1]
    const pass = accountInfo[2]

    try {
      let albums
      let inputs = {
        username: '#username',
        password: '#password'
      }
      let url
      let loginBtn
      let playBtn
      let shuffle

      switch (player) {
        case 'napster':
          url = 'https://app.napster.com/login/'
          loginBtn = '.signin'
          albums = [
            'https://app.napster.com/artist/honey/album/just-another-emotion',
            'https://app.napster.com/artist/yokem/album/boombeats',
            'https://app.napster.com/artist/hanke/album/new-york-story',
          ]
          playBtn = '.track-list-header .shuffle-button'
          shuffle = '.repeat-button'
          break
        case 'tidal':
          url = 'https://listen.tidal.com/login'
          loginBtn = '.js-login-form button'
          albums = [
            'https://listen.tidal.com/album/88716570',
          ]
          playBtn = '...'
          break
        case 'spotify':
          url = 'https://spotify.com/login'
          loginBtn = '#login-button'
          albums = [
            'https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX',
            'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
            'https://open.spotify.com/album/6vvfbzMU2dkFQRJiP99RS4',
          ]
          playBtn = '.tracklist-play-pause.tracklist-middle-align'
          shuffle = '.spoticon-shuffle-16'
          inputs.username = 'form input[name="username"]'
          inputs.password = 'form input[name="password"]'
          break
        default:
      }

      const album = () => albums[rand(albums.length)]
      let nAl = album()

      const unradio = await nightmare
        .goto(url)
        .wait(5000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .click(loginBtn)
        .wait(5000 + rand(2000))
        .goto(nAl)
        .wait(5000 + rand(2000))
        .evaluate(() => {
          return $('.unradio').text() || $('.account-issue').text() || $('.single-stream-error').text()
        })

      if (unradio) {
        throw 'getout';
      }

      await nightmare
        .click(playBtn)
        .wait(5000 + rand(2000))
        .click(shuffle)

      await console.log('in : ' + account)

      inter = setInterval(async () => {
        let aUrl = album()

        while (aUrl === nAl) {
          aUrl = album()
        }

        console.log(nAl, aUrl)
        nAl = aUrl

        try {
          await nightmare
            .goto(nAl)
            .wait(5000 + rand(2000))
            .click(playBtn)
        }
        catch (e) {
          // nightmare.screenshot(login + '.png')
          console.log('change error')
        }
      }, 1000 * 60 * 15 + rand(1000 * 60 * 10));

      setTimeout(async () => {
        console.log('out : ' + account)
        push()
        clearInterval(inter)
        await nightmare.end()
        main(account)
      }, 1000 * 60 * 60 + rand(1000 * 60 * 60));

      if (accounts.length && !restartAccount) {
        setTimeout(() => {
          main()
        }, 1000 * 60 * 5);
      }
    }
    catch (e) {
      console.log("error", account, e)
      clearInterval(inter)
      // await nightmare.screenshot(login + '.png')
      await nightmare.end()
      if (account) {
        push(e)
        if (accounts.length) {
          setTimeout(() => {
            main(login)
          }, rand(1000 * 60 * 5));
        }
      }
    }
  }, restartAccount ? rand(1000 * 60 * 60) : 0);
}

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  main()
});