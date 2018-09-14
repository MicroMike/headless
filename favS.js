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
let retrycount = 0
let trycount = 0

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

let captcha = ''
const anticaptcha = (captchaisNew, nightmare) => {
  // return new Promise((resolve, reject) => {
  request({
    url: 'https://api.anti-captcha.com/createTask',
    method: 'POST',
    json: true,
    data: {
      clientKey: '7b45c941a5b79b23935e9f43f56a39c7',
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
            clientKey: '7b45c941a5b79b23935e9f43f56a39c7',
            taskId: response.taskId
          }
        }, async (err, res, response) => {
          try {
            if (response.status !== 'processing') {
              trycount++
              clearInterval(interval)
              captcha = response.solution.gRecaptchaResponse
              if (nightmare) {
                retrycount++
                await nightmare
                  .wait(2000 + rand(2000))
                  .evaluate((captcha) => {
                    console.log('CAPTCHA2')
                    document.getElementById('g-recaptcha-response').value = captcha
                    return true
                  }, captcha)

                await nightmare
                  .wait(2000 + rand(2000))
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
            if (nightmare) {
              await nightmare.end()
            }
          }
        });
      }
      catch (e) {
        clearInterval(interval)
        if (nightmare) {
          nightmare.end()
        }
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

  let account

  let inter
  let interloop

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
  let pause = rand(4) + 2

  const album = () => albums[rand(albums.length)]
  let nAl

  let month = rand(12) + 1
  month = month < 10 ? '0' + month : '' + month

  let isPause = false
  let freeze = 0

  let player
  let login
  let pass

  const loop = async (refresh) => {
    try {
      let aUrl = album()

      while (aUrl === nAl) {
        aUrl = album()
      }

      nAl = aUrl

      // change = refresh ? change : change + 1
      // if (change > pause) {
      //   change = 0
      //   pause = rand(4) + 2
      //   isPause = true
      //   // console.log(account, 'change pause')
      //   return
      // }

      isPause = false

      // console.log('change : ' + nAl)
      if (refresh) {
        await nightmare
          .refresh()
      }
      else {
        await nightmare
          .goto(nAl)
      }

      let like = await nightmare
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
    }
    catch (e) {
      if (/wait/.test(e)) {
        console.log('need out no play btn ' + login)
        clearInterval(inter)
        clearInterval(interloop)
        accountsValid = accountsValid.filter(a => a !== account)
        await nightmare.end()
        return
      }
      console.log('loop error (' + e.code + ') ' + login)
      setTimeout(() => {
        loop(true)
      }, 1000 * 60 * 2);
      return
    }
  }

  let time
  let time2

  interloop = setInterval(async () => {
    time2 = time
    time = await nightmare.evaluate(() => {
      return document.querySelector('.playback-bar__progress-time') && document.querySelector('.playback-bar__progress-time').innerHTML
    })

    if (time && time === time2) {
      if (freeze === 3) {
        console.log('soon ' + login + ' ' + time + ' ' + time2)
      }
      if (++freeze > 10 && !isPause) {
        console.log('force loop ' + login)
        time = null
        time2 = null
        freeze = 0
        isPause = true

        setTimeout(async () => {
          loop(true)
        }, 1000 * 60 + rand(1000 * 60));
      }
    }
    else {
      freeze = 0
    }
  }, 10000);

  try {

    let catcherror = 0
    await nightmare
      .catch((e) => {
        console.log('catcherror: ' + catcherror + ' ' + login)
        if (++catcherror > 5) {
          console.log('out' + login)
          clearInterval(inter)
          clearInterval(interloop)
          accountsValid = accountsValid.filter(a => a !== account)
          nightmare.end()
        }
        else {
          loop(true)
        }
      })

    account = isnew
      ? await nightmare
        .goto('https://www.tempmailaddress.com')
        .wait(2000)
        .evaluate(() => {
          let email = document.getElementById('email').innerText
          return 'spotify:' + email + ':' + email
        })
      : accounts.shift()

    accountInfo = account.split(':')
    player = accountInfo[0]
    login = accountInfo[1]
    pass = accountInfo[2]

    if (isnew) {
      await nightmare
        .goto('https://spotify.com/signup')

      await nightmare
        .type('#register-email', login)
        .type('#register-confirm-email', login)
        .type('#register-password', login)
        .type('#register-displayname', login.split('@')[0])
        .type('#register-dob-day', rand(25) + 1)
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
        anticaptcha(isnew, nightmare)
        await nightmare
          .wait('#done_captcha')
          .click('#register-button-email-submit')
          .wait(6000 + rand(2000))
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
        .wait(6000 + rand(2000))
        .goto('https://www.spotify.com/account/overview/')
        .wait('.logout-link')
        .wait(2000 + rand(2000))
    }

    loop()

    accountsValid.push(account)

    fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
      if (err) return console.log(err);
    });

    processing = false

    if (process.env.TEST) {
      inter = setInterval(loop, 1000 * 60 * 5);
    }
    else {
      // inter = setInterval(loop, 1000 * 60 * 20 + rand(1000 * 60 * 40));
    }
  }
  catch (e) {
    if (!e.code && !/wait/.test(e)) {
      console.log(e)
    }
    else {
      if (isnew) {
        console.log('timeout')
      }
      else {
        console.log(e)
      }
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
  accounts.sort()
  accounts.sort(() => { return parseInt(Math.random() * 10, 10) % 2 === 0 })
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

  fs.readFile('maxnb.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    maxnb = data
  });
}, 1000 * 120)

let length1
setInterval(() => {
  if (length1 !== accountsValid.length + trycount + retrycount) {
    console.log('total ' + accountsValid.length + '/' + trycount + ' retry: ' + retrycount)
  }
  length1 = accountsValid.length + trycount + retrycount
}, 1000 * 5);

setInterval(() => {
  fs.readFile('albums.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    albums = data.split(',')
    // console.log('albums ' + albums.length)
  });
}, 1000 * 60 * 60);