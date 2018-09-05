const fs = require('fs');
var request = require('ajax-request');

let accounts = []
let accountsValid = []
let processing = false;
let onecaptcha = false;
let total
let errors = []
let albums = []
let maxnb = 10
let isPause = false

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
      clientKey: '21648811563096fd1970c47f55b3d548',
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
      }, 1000 * 60);
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
          clientKey: '21648811563096fd1970c47f55b3d548',
          taskId: response.taskId
        }
      }, function (err, res, response) {
        try {
          if (response && response.status !== 'processing') {
            clearInterval(interval)
            captcha = response.solution.gRecaptchaResponse
            main(captchaisNew)
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

const main = async (isnew) => {
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 120,
    show: true,
    width: 300,
    height: 300,
    typeInterval: 300,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      experimentalFeatures: true
    }
  })

  let account = isnew
    ? await nightmare
      .goto('https://www.tempmailaddress.com')
      .wait(2000)
      .evaluate(() => {
        if (!document.querySelector('body').innerHTML) {
          return 'error'
        }
        let email = document.getElementById('email').innerText
        return 'spotify:' + email + ':' + email
      })
    : accounts.shift()

  if (accountsValid.length < 5) {
    // console.log(account)
  }

  if (account === 'error') {
    await nightmare.refresh()
    main(isnew)
    return
  }

  fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
    if (err) return console.log(err);
  });

  let inter

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

  url = 'https://accounts.spotify.com/login'
  loginBtn = '#login-button'
  playBtn = '.tracklist-play-pause.tracklist-middle-align'
  inputs.username = 'form input[name="username"]'
  inputs.password = 'form input[name="password"]'

  let change = 0
  let pause = rand(2) + 2

  const album = () => albums[rand(albums.length)]
  let nAl

  let month = rand(12) + 1
  month = month < 10 ? '0' + month : '' + month

  try {
    if (isnew) {
      await nightmare
        .goto('https://spotify.com/signup')

      await nightmare
        .type('#register-email', login)
        .type('#register-confirm-email', login)
        .type('#register-password', login)
        .type('#register-displayname', login.split('@')[0])
        .type('#register-dob-day', rand(28) + 1)
        .select('#register-dob-month', month)
        .type('#register-dob-year', rand(32) + 1963)
        .click('#register-' + (rand(2) ? 'male' : 'female'))
        .wait(2000 + rand(2000))
        .evaluate((captcha) => {
          console.log('CAPTCHA')
          document.getElementById('g-recaptcha-response').value = captcha
        }, captcha)

      await nightmare
        .wait(2000 + rand(2000))
        .click('#register-button-email-submit')
        .wait('.nowPlayingBar-container')
        .wait(2000 + rand(2000))

      await nightmare
        .goto('https://www.tempmailaddress.com')

      var urlactivate = await nightmare
        .wait('#schranka tr.hidden-md[data-href="2"]')
        .goto('https://www.tempmailaddress.com/email/id/2')
        .forward()
        .goto('https://www.tempmailaddress.com/email/id/2')
        .forward()
        .wait('.call-to-action-button')
        .evaluate(() => {
          return document.getElementsByClassName('call-to-action-button')[0].href;
        })

      await nightmare
        .goto(urlactivate)
        .wait(5000)
    }
    else {
      const error = await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .wait(2000 + rand(2000))
        .evaluate((captcha) => {
          window.___grecaptcha_cfg.clients[0].aa.l.callback(captcha)
        }, captcha)

      await nightmare
        .wait('.user-details')
    }

    const loop = async (refresh) => {
      try {
        if (refresh) {
          await nightmare.refresh()
        }
        else {
          let aUrl = album()

          while (aUrl === nAl) {
            aUrl = album()
          }

          nAl = aUrl

          if (++change > pause) {
            change = 0
            pause = rand(2) + 2
            isPause = true
            // console.log(account, 'change pause')
            return
          }
        }

        isPause = false

        // console.log('change : ' + nAl)
        let like = await nightmare
          .wait(2000 + rand(2000))
          .goto(nAl)
          .wait(2000 + rand(2000))
          .evaluate(() => {
            let playBtn = '.tracklist-play-pause.tracklist-middle-align'

            if (!document.querySelector(playBtn)) {
              return 'error'
            }

            document.querySelector(playBtn) && document.querySelector(playBtn).click()

            setTimeout(() => {
              let shuffle = '.spoticon-shuffle-16:not(.control-button--active)'
              document.querySelector(shuffle) && document.querySelector(shuffle).click()
            }, 1000);

            setTimeout(() => {
              let repeat = '.spoticon-repeat-16:not(.control-button--active)'
              document.querySelector(repeat) && document.querySelector(repeat).click()
            }, 2000);

            setTimeout(() => {
              let like = '.spoticon-heart-24'
              // document.querySelector(like) && document.querySelector(like).click()
            }, 5000);
          })

        if (like === 'error') {
          throw 'error'
        }
      }
      catch (e) {
        console.log('loop error (' + e.code + ') ' + login)
        setTimeout(() => {
          loop(true)
        }, 1000 * 60);
      }
    }

    loop()

    accountsValid.push(account)
    processing = false

    // inter = setInterval(loop, 1000 * 60 * 15 + rand(1000 * 60 * 5));
    inter = setInterval(loop, 1000 * 60 * 1);
    let time
    let time2

    setInterval(async () => {
      time = await nightmare.evaluate(() => {
        return document.querySelector('.playback-bar__progress-time').innerHTML
      })
    }, 2000)

    setTimeout(() => {
      setInterval(async () => {
        time2 = await nightmare.evaluate(() => {
          return document.querySelector('.playback-bar__progress-time').innerHTML
        })
      }, 2000)
    }, 1000);

    setInterval(() => {
      console.log(isPause, time, time2)
      if (!isPause && time === time2) {
        loop(true)
      }
    }, 5000);
  }
  catch (e) {
    if (e.code) {
      if (e.code === -1) {
        console.log(e)
      }
      else {
        console.log('error ' + login + ' ' + e.code)
      }
      if (errors.indexOf(e.code) >= 0) {
        // accounts.unshift(account)ca
      }
    }
    else if (!/wait/.test(e)) {
      console.log(login + ' error login', e)
    }
    else {
      console.log('timeout')
    }
    accountsValid = accountsValid.filter(a => a !== account)
    await nightmare.end()
    processing = false
  }
}

fs.readFile('albums.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  albums = data.split(',')
  // console.log('albums ' + albums.length)
});

fs.readFile(process.env.FILE, 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  // console.log(accounts.length)
});

anticaptcha(true)

setInterval(() => {
  if (accounts.length - 1 && accountsValid.length < maxnb) {
    // anticaptcha(true)
    if (!process.env.TEST) {
      anticaptcha(process.env.ALLNEW || rand(2) % 2 === 0)
    }
  }

  // fs.readFile(process.env.FILE, 'utf8', function (err, data) {
  //   if (err) return console.log(err);
  //   let tempaccounts = data.split(',')
  //   accounts = tempaccounts.filter(account => accountsValid.indexOf(account) === -1)
  //   if (accountsValid.length < 5) {
  //     console.log(accounts.length)
  //   }
  // });

  fs.readFile('errors.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    errors = data.split(',')
  });

  fs.readFile('maxnb.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    maxnb = data
  });
}, 1000 * 90)

setInterval(() => {
  console.log('total ' + accountsValid.length + '/' + accounts.length + ' left')
}, 1000 * 60 * 2);

setInterval(() => {
  fs.readFile('albums.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    albums = data.split(',')
    console.log('albums ' + albums.length)
  });
}, 1000 * 60 * 60);