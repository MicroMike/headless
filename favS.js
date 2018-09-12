const fs = require('fs');
var request = require('ajax-request');
let tempLog

// console.log = (log) => {
//   if (tempLog === log) {
//     return
//   }
//   tempLog = log
//   console.log(log)
// }

let accounts = []
let accountsValid = []
let processing = false;
let onecaptcha = false;
let total
let errors = []
let albums = []
let maxnb = 10
let trycount = 0

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

let captcha = ''
const anticaptcha = (captchaisNew, nightmare) => {
  trycount++
  // return new Promise((resolve, reject) => {
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
    const interval = setInterval(() => {
      try {
        request({
          url: 'https://api.anti-captcha.com/getTaskResult',
          method: 'POST',
          json: true,
          data: {
            clientKey: '21648811563096fd1970c47f55b3d548',
            taskId: response.taskId
          }
        }, async (err, res, response) => {
          try {
            if (response.status !== 'processing') {
              clearInterval(interval)
              captcha = response.solution.gRecaptchaResponse
              if (nightmare) {
                await nightmare
                  .wait(2000 + rand(2000))
                  .evaluate((captcha) => {
                    console.log('CAPTCHA2')
                    document.getElementById('g-recaptcha-response').value = captcha
                    return true
                  }, captcha)

                await nightmare
                  .wait(2000 + rand(2000))
                  .click('#register-button-email-submit')
                  .wait(6000 + rand(2000))
                  .evaluate(() => {
                    document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', '<div id="done_captcha">!!!</div>');
                    return true
                  })
              }
              else {
                main(captchaisNew)
              }
            }
          }
          catch (e) {
            clearInterval(interval)
          }
        });
      }
      catch (e) {
        clearInterval(interval)
      }
    }, 10000)
  });
  // })
}

const anticaptcha2 = (captchaisNew) => {
  request({
    url: 'https://www.solverecaptcha.com/api2/scripts/ajax.php?q=threads&user_id=828'
  }, (err, res, response) => {
    if (response < 1) {
      // if (onecaptcha || processing) { return } 
      processing = true;
      request({
        url: 'https://api.solverecaptcha.com/',
        method: 'GET',
        data: {
          user_id: 828,
          key: 'b1af193c-5b8d1484b09714.95530866',
          sitekey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
          pageurl: captchaisNew ? 'https://spotify.com/signup' : 'https://accounts.spotify.com/login',
        }
      }, function (err, res, response) {
        response = response && response.split('|')
        let status = response && response[0]
        if (status) {
          captcha = response[1]
          main(captchaisNew)
          return
        }
        console.log('nope')
      })
    }
  })
}

const main = async (isnew) => {
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 60 * 3,
    show: true,
    width: 600,
    height: 600,
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
        let email = document.getElementById('email').innerText
        return 'spotify:' + email + ':' + email
      })
    : accounts.shift()

  if (accountsValid.length < 5) {
    // console.log(account)
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

  let isPause = false
  let freeze = 0

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

      let fail = await nightmare
        .wait(2000 + rand(2000))
        .click('#register-button-email-submit')
        .wait(6000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('#register-confirm-email')
        })

      if (fail) {
        console.log('try')
        anticaptcha(isnew, nightmare)
        await nightmare.wait('#done_captcha')
      }

      await nightmare
        .goto('https://www.spotify.com/account/overview/')
        .wait('.logout-link')
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
      await nightmare
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

    let needloop = false

    const loop = async (refresh) => {
      try {
        if (!refresh) {
          let aUrl = album()

          while (aUrl === nAl) {
            aUrl = album()
          }

          nAl = aUrl
        }

        if (++change > pause) {
          change = 0
          pause = rand(2) + 2
          isPause = true
          // console.log(account, 'change pause')
          return
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

            return true
          })

        if (like === 'error') {
          throw 'error'
        }
      }
      catch (e) {
        console.log('loop error (' + e.code + ') ' + login)
        loop(true)
      }
    }

    loop()

    accountsValid.push(account)
    processing = false

    if (process.env.TEST) {
      inter = setInterval(loop, 1000 * 60 * 5);
    }
    else {
      inter = setInterval(loop, 1000 * 60 * 25 + rand(1000 * 60 * 5));
    }

    let time
    let time2

    let interloop = setInterval(async () => {
      if (!isPause && time && time === time2) {
        if (++freeze > 5) {
          console.log('force loop ' + login)
          time = null
          time2 = null
          freeze = 0

          try {
            await nightmare
              .goto('https://www.spotify.com/account/overview/')
              .wait(2000 + rand(2000))
              .wait('#card-profile-username')

            loop(true)
          }
          catch (e) {
            console.log('out ' + login)
            clearInterval(interloop)
            accountsValid = accountsValid.filter(a => a !== account)
            await nightmare.end()
          }
        }
      }
      else {
        freeze = 0
        time2 = time
        time = await nightmare.evaluate(() => {
          return document.querySelector('.playback-bar__progress-time') && document.querySelector('.playback-bar__progress-time').innerHTML
        })
      }
    }, 10000);
  }
  catch (e) {
    if (!e.code && !/wait/.test(e)) {
      console.log(e)
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

  // fs.readFile('errors.txt', 'utf8', function (err, data) {
  //   if (err) return console.log(err);
  //   errors = data.split(',')
  // });

  fs.readFile('maxnb.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    maxnb = data
  });
}, 1000 * 60 + rand(1000 * 30))

setInterval(() => {
  console.log('total ' + accountsValid.length + '/' + trycount)
}, 1000 * 60 * 2);

setInterval(() => {
  fs.readFile('albums.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    albums = data.split(',')
    console.log('albums ' + albums.length)
  });
}, 1000 * 60 * 60);