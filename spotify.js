const fs = require('fs');
var request = require('ajax-request');

let accounts = []
let accountsValid = []
let processing = false;
let total
let albums = [
  'https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX',
  'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
  'https://open.spotify.com/album/6vvfbzMU2dkFQRJiP99RS4',
]

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

let captcha = ''
const anticaptcha = (captchaisNew) => {
  processing = true;
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
      console.log(response)
      setTimeout(() => {
        anticaptcha()
      }, 1000 * 60 * 1);
      return;
    }
    else if (!response) {
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
        try {
          if (response && response.status !== 'processing') {
            clearInterval(interval)
            captcha = response.solution.gRecaptchaResponse
            main()
          }
          else if (!response) {
            anticaptcha()
            clearInterval(interval)
          }
        }
        catch (e) {
          anticaptcha()
          clearInterval(interval)
        }
      });
    }, 10000)
  });
}


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
      waitTimeout: 1000 * 60,
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

      let inputs = {
        username: '#username',
        password: '#password'
      }
      let url
      let loginBtn
      let playBtn

      url = 'https://accounts.spotify.com/dk/login'
      loginBtn = '#login-button'
      playBtn = '.tracklist-play-pause.tracklist-middle-align'
      inputs.username = 'form input[name="username"]'
      inputs.password = 'form input[name="password"]'

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

      // if (free) {
      //   throw 'getout'
      // }

      accountsValid.push(account)
      if (accountsValid.length === 1 || accountsValid.length % 10) {
        console.log('total ' + accountsValid.length)
      }

      let already = await nightmare
        .goto(nAl)
        .wait(4000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('.connect-bar')
        })

      // if (already) {
      //   throw {
      //     code: 1
      //   }
      // }

      await nightmare
        .click(playBtn)
        .wait(4000 + rand(2000))
        .evaluate(() => {
          let shuffle = '.spoticon-shuffle-16:not(.control-button--active)'
          let repeat = '.spoticon-repeat-16:not(.control-button--active)'
          document.querySelector(shuffle) && document.querySelector(shuffle).click()
          document.querySelector(repeat) && document.querySelector(repeat).click()
        })
      // .click(shuffle)

      let change = 0
      let pause = rand(8) + 2

      inter = setInterval(async () => {
        try {
          let aUrl = album()

          while (aUrl === nAl) {
            aUrl = album()
          }

          nAl = aUrl
          // console.log('change : ' + nAl)
          let interalready = await nightmare
            .goto(nAl)
            .wait(4000 + rand(2000))
            .evaluate(() => {
              return document.querySelector('.connect-bar')
            })

          if (interalready) {
            throw {
              code: 1
            }
          }

          if (++change > pause) {
            change = 0
            pause = rand(8) + 2
            // console.log(account, 'change pause')
            return
          }

          await nightmare
            .click(playBtn)

          // console.log(account, 'change ok ' + change + '/' + pause + ' : ' + total)
        }
        catch (e) {
          console.log('loop error ' + account + ' ' + e.code)
          accountsValid = accountsValid.filter(a => a !== account)
          if (e.code) {
            accounts.push(account)
          }
          else {
            console.log(e)
          }
          clearInterval(inter)
          await nightmare.end()
        }
      }, 1000 * 60 * 10 + rand(1000 * 60 * 5));

      // setTimeout(async () => {
      // console.log('out : ' + account)
      // clearInterval(inter)
      // await nightmare.end()
      // accounts.push(account)
      // main(true)
      // }, 1000 * 60 * 60 + rand(1000 * 60 * 60));

      processing = false
    }
    catch (e) {
      console.log('error ' + account + ' ' + e.code)
      accountsValid = accountsValid.filter(a => a !== account)
      if (e.code) {
        accounts.push(account)
      }
      else {
        console.log(e)
        fs.writeFile('spotifyAccount.txt', accountsValid.concat(accounts), function (err) {
          if (err) return console.log(err);
        });
      }
      await nightmare.end()
      processing = false
    }
  }, restart ? rand(1000 * 60 * 60) : 0);
}

fs.readFile('spotifyAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  // console.log(accounts)
  anticaptcha()
});

setInterval(() => {
  if (accounts.length && !processing) {
    anticaptcha()
  }
}, 1000 * 10)

setInterval(() => {
  console.log('total ' + accountsValid.length)

  fs.readFile('spotifyAccount.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    let tempaccounts = data.split(',')
    accounts = accounts.filter(account => accountsValid.indexOf(account) === -1)
    console.log('new accounts ' + accounts.length)
    // console.log(accounts)
  });

  fs.readFile('albums.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    albums = data.split(',')
    console.log('albums ' + albums.length)
  });
}, 1000 * 60 * 15);
