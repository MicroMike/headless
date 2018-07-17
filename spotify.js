let accounts = []
let accountsValid = []

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

var request = require('ajax-request');
let captcha = ''
const anticaptcha = (captchaisNew) => {
  request({
    url: 'https://api.anti-captcha.com/createTask',
    method: 'POST',
    json: true,
    data: {
      clientKey: '5cf44dee27fed739df49a69bb4494b9a',
      task: {
        type: 'NoCaptchaTaskProxyless',
        websiteKey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
        websiteURL: captchaisNew ? 'https://spotify.com/dk/signup' : 'https://accounts.spotify.com/dk/login',
        invisible: captchaisNew ? 0 : 1
      }
    }
  }, function (err, res, response) {
    // console.log(response)
    if (response && response.errorId) {
      setTimeout(() => {
        anticaptcha()
      }, 1000 * 60 * 1);
      return;
    }
    else if (!response) {
      console.log(err)
      anticaptcha()
      return
    }

    const interval = setInterval(() => {
      request({
        url: 'https://api.anti-captcha.com/getTaskResult',
        method: 'POST',
        json: true,
        data: {
          clientKey: '5cf44dee27fed739df49a69bb4494b9a',
          taskId: response.taskId
        }
      }, function (err, res, response) {
        if (response && response.status !== 'processing') {
          clearInterval(interval)
          captcha = response.solution.gRecaptchaResponse
          main()
        }
        else if (!response) {
          anticaptcha()
          clearInterval(interval)
        }
      });
    }, 10000)
  });
}

const fs = require('fs');

const main = async (restart) => {
  setTimeout(async () => {
    let account = accounts.shift()
    while (accountsValid.indexOf(account) >= 0) {
      fs.writeFile('spotifyAccount.txt', accountsValid.concat(accounts), function (err) {
        if (err) return console.log(err);
      });
      if (accounts.length) {
        account = accounts.shift()
      }
    }
    let inter
    const Nightmare = require('nightmare')
    const nightmare = Nightmare({
      electronPath: require('electron'),
      // openDevTools: {
      //   mode: 'detach'
      // },
      alwaysOnTop: false,
      waitTimeout: 1000 * 30,
      show: true,
      typeInterval: 300,
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
        plugins: true,
        experimentalFeatures: true
      }
    })

    try {
      accountInfo = account.split(':')
      const player = accountInfo[0]
      const login = accountInfo[1]
      const pass = accountInfo[2]

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
          url = 'https://accounts.spotify.com/dk/login'
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

      const error = await nightmare
        .goto(url)
        .wait(4000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .wait(2000)
        .evaluate((captcha) => {
          window.___grecaptcha_cfg.clients[0].aa.l.callback(captcha)
        }, captcha)
      // .click(loginBtn)

      const free = await nightmare
        .wait(4000 + rand(2000))
        .goto('https://www.spotify.com/dk/account/overview/')
        .wait('#js-navbar')
        .wait(4000 + rand(2000))
        .evaluate(() => {
          return /free/.test($('.subscription-status').html())
        })

      if (free) {
        throw 'getout'
      }

      accountsValid.push(account)
      await console.log('in : ' + account + ' ' + accountsValid.length)

      // fs.appendFile('spotifyWhiteList.txt', account + '--' + date + '\r\n', function (err) {
      //   if (err) return console.log(err);
      // });

      // fs.writeFile('spotifyAccount.txt', accounts.join(','), function (err) {
      //   if (err) return console.log(err);
      // });

      await nightmare
        .goto(nAl)
        .wait(4000 + rand(2000))
        .click(playBtn)
        .wait(4000 + rand(2000))
        .click(shuffle)

      let change = 0
      let pause = rand(8) + 2

      inter = setInterval(async () => {
        let aUrl = album()

        while (aUrl === nAl) {
          aUrl = album()
        }

        nAl = aUrl
        // console.log('change : ' + nAl)
        await nightmare
          .goto(nAl)
          .wait(4000 + rand(2000))

        if (++change > pause) {
          change = 0
          pause = rand(8) + 2
          return
        }

        await nightmare
          .click(playBtn)
      }, 1000 * 60 * 10 + rand(1000 * 60 * 5));

      // setTimeout(async () => {
      // console.log('out : ' + account)
      // clearInterval(inter)
      // await nightmare.end()
      // accounts.push(account)
      // main(true)
      // }, 1000 * 60 * 60 + rand(1000 * 60 * 60));

      if (accounts.length && !restart) {
        anticaptcha()
      }
    }
    catch (e) {
      console.log("error", account, e)
      // accounts.push(account)
      // clearInterval(inter)
      fs.writeFile('spotifyAccount.txt', accountsValid.concat(accounts), function (err) {
        if (err) return console.log(err);
      });
      await nightmare.end()
      if (accounts.length) {
        anticaptcha()
      }
    }
  }, restart ? rand(1000 * 60 * 60) : 0);
}

fs.readFile('spotifyAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  // console.log(accounts)
  anticaptcha()
});