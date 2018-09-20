const request = require('ajax-request');
const fs = require('fs');

process.env.FILE = process.env.FILE || 'spotifyAccount.txt'

let accounts = []
let accountsValid = []
let sessions = []
let tryCaptcha = 0

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const anticaptcha = (captchaisNew, nightmare) => {
  request({
    url: 'https://api.anti-captcha.com/createTask',
    method: 'POST',
    json: true,
    data: {
      clientKey: '0cab7e41bab98900c321592426ec2183',
      task: {
        type: 'NoCaptchaTaskProxyless',
        websiteKey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
        websiteURL: captchaisNew ? 'https://spotify.com/ie/signup' : 'https://accounts.spotify.com/ie/login',
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
            clientKey: '0cab7e41bab98900c321592426ec2183',
            taskId: response.taskId
          }
        }, async (err, res, response) => {
          try {
            if (response.status !== 'processing') {
              clearInterval(interval)
              const captcha = response.solution.gRecaptchaResponse
              await nightmare
                .wait(2000 + rand(2000))
                .evaluate((captcha) => {
                  console.log('CAPTCHA')
                  document.getElementById('g-recaptcha-response').value = captcha
                  return true
                }, captcha)

              const notconected = await nightmare
                .wait(2000 + rand(2000))
                .click('#register-button-email-submit')
                .wait(4000 + rand(2000))
                .evaluate(() => {
                  return document.querySelector('#register-confirm-email')
                })

              if (notconected) {
                if (++tryCaptcha < 3) {
                  anticaptcha(true, nightmare)
                }
                else {
                  tryCaptcha = 0
                  await nightmare.end(() => {
                    main()
                  })
                }
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
}

const main = async (session) => {
  tryCaptcha = 0
  const persist = session || 'persist: ' + Date.now()
  let isconected
  let step
  let inter
  let interloop
  let inputs = {
    username: 'form input[name="username"]',
    password: 'form input[name="password"]'
  }
  let url = 'https://accounts.spotify.com/login'
  let loginBtn = '#login-button'
  let playBtn = '.tracklist-play-pause.tracklist-middle-align'
  let change = 0
  let pause = rand(4) + 2

  let month = rand(12) + 1
  month = month < 10 ? '0' + month : '' + month

  let player
  let login
  let pass

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: !session,
    waitTimeout: 1000 * 60 * 10,
    show: true,
    width: 600,
    height: 600,
    typeInterval: 300,
    webPreferences: {
      partition: persist,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      experimentalFeatures: true
    }
  })

  try {
    if (session) {
      isconected = await nightmare
        .goto('https://www.spotify.com/account/overview/')
        .wait(2000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('.logout-link')
        })

      if (process.env.TEST && !isconected) {
        sessions = sessions.filter(a => a !== session)
        fs.writeFile('sessions.txt', sessions.join(','), function (err) {
          if (err) return console.log(err);
        });

        return
      }
    }

    if (!session || !isconected) {
      const isnew = true//rand(2) === 0
      const account = isnew
        ? await nightmare
          .goto('https://www.tempmailaddress.com')
          .wait(2000)
          .evaluate(() => {
            let email = document.getElementById('email').innerText
            return 'spotify:' + email + ':' + email
          })
          .then()
          .catch(async (e) => {
            console.log('catch tempmail start')
            await nightmare.end(() => {
              main()
            })
          })
        : accounts.shift()

      accountInfo = account.split(':')
      player = accountInfo[0]
      login = accountInfo[1]
      pass = accountInfo[2]

      let logError

      if (isnew) {
        anticaptcha(true, nightmare)

        const urlactivate = await nightmare
          .goto('https://spotify.com/ie/signup')
          .wait('#register-email')
          .type('#register-email', login)
          .type('#register-confirm-email', login)
          .type('#register-password', login)
          .type('#register-displayname', login.split('@')[0])
          .type('#register-dob-day', rand(25) + 1)
          .select('#register-dob-month', month)
          .type('#register-dob-year', rand(32) + 1963)
          .click('#register-' + (rand(2) ? 'male' : 'female'))
          .wait('.logout-link')
          .wait(2000 + rand(2000))
          .goto('https://www.tempmailaddress.com')
          .wait('#schranka tr.hidden-md[data-href="2"]')
          .goto('https://www.tempmailaddress.com/email/id/2')
          .forward()
          .goto('https://www.tempmailaddress.com/email/id/2')
          .forward()
          .wait('.call-to-action-button')
          .evaluate(() => {
            return document.getElementsByClassName('call-to-action-button')[0].href;
          })
          .then()
          .catch(async (e) => {
            console.log('catch signup 2')
            logError = true
            await nightmare.end(() => {
              main()
            })
          })

        if (logError) {
          return
        }

        await nightmare
          .goto(urlactivate)
          .wait(2000 + rand(2000))

      }
      else {
        await nightmare
          .goto('https://spotify.com/ie/login')
          .type(inputs.username, login)
          .type(inputs.password, pass)
          .wait('.logout-link')
          .wait(2000 + rand(2000))
          .then()
          .catch(async (e) => {
            console.log('catch login')
            logError = true
            await nightmare.end(() => {
              fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
                if (err) return console.log(err);
                main(persist)
              });
            })
          })

        if (logError) {
          return
        }
      }

      accountsValid.push(account)
      fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
        if (err) return console.log(err);
      });

      if (!session) {
        sessions.push(persist)
        fs.writeFile('sessions.txt', sessions.join(','), function (err) {
          if (err) return console.log(err);
        });
      }

      if (accountsValid.length < 15) {
        main()
      }
    }

    await nightmare
      .goto('https://open.spotify.com/playlist/2d64R3iEY5cCDwTmLt9bwr')
      .wait(2000 + rand(2000))
      .evaluate(() => {
        const timeout = 8000

        setTimeout(() => {
          let play = '.tracklist-top-align'
          document.querySelector(play) && document.querySelector(play).click()
        }, timeout);

        setTimeout(() => {
          let shuffle = '.spoticon-shuffle-16:not(.control-button--active)'
          document.querySelector(shuffle) && document.querySelector(shuffle).click()
        }, timeout + 1000);

        setTimeout(() => {
          let repeat = '.spoticon-repeat-16:not(.control-button--active)'
          document.querySelector(repeat) && document.querySelector(repeat).click()
        }, timeout + 2000);

        return true
      })
      .then()
      .catch(async (e) => {
        console.log('catch play')
        await nightmare.end(() => {
          accountsValid = accountsValid.filter(a => a !== account)
          main()
        })
      })

    setTimeout(async () => {
      await nightmare.end(() => {
        main(persist)
      })
    }, 1000 * 60 * 5 + rand(1000 * 60 * 10));
  }
  catch (e) {
    console.log('global catch ' + e)
    await nightmare.end(() => {
      main(persist)
    })
  }
}

fs.readFile(process.env.FILE, 'utf8', function (err, data) {
  if (err) return console.log(err);
  if (data) {
    accounts = data.split(',')
  }

  fs.readFile('sessions.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    if (data) {
      sessions = data.split(',')
    }

    if (process.env.TEST) {
      for (let session of sessions) {
        main(session)
      }
    }

    if (process.env.ADD) {
      main()
    }
  });
});
