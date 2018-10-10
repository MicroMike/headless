const request = require('ajax-request');
const fs = require('fs');

process.env.FILE = process.env.FILE || 'spotifyAccount.txt'

let accounts = []
let accountsValid = []
let sessions = []
let sessionsbis = []
let size
let dealer = 0

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const albums = [
  'https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX',
  'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
  'https://open.spotify.com/album/6vvfbzMU2dkFQRJiP99RS4',
  // 'https://open.spotify.com/album/3OCGq91kV8ZtN5qDUI1XA9',
  // 'https://open.spotify.com/album/45is933jCRlQOt6km073H5'
]
const album = () => albums[rand(albums.length)]

const anticaptcha = (captchaisNew, nightmare) => {
  let tryCaptcha = 0
  let error = false
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
                .wait('#doneform')
                .wait(2000 + rand(2000))
                .evaluate((data) => {
                  console.log('CAPTCHA')

                  if (data.captchaisNew && document.getElementById('g-recaptcha-response')) {
                    document.getElementById('g-recaptcha-response').value = data.captcha
                    setTimeout(() => {
                      document.getElementById('register-button-email-submit').click()
                    }, 3000);
                    setTimeout(() => {
                      document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', '<div id="micromike"></div>')
                    }, 6000);
                  }
                  else if (window.___grecaptcha_cfg) {
                    let clients = window.___grecaptcha_cfg.clients[0]
                    Object.keys(clients).map(key => {
                      let client = clients[key]
                      Object.keys(client).map(k => {
                        let l = client[k]
                        l && l.callback && l.callback(data.captcha)
                      })
                    })
                  }
                  else {
                    throw 'error no captcha'
                  }
                }, { captcha, captchaisNew })
                .then()
                .catch(async (e) => {
                  console.log('catch captcha ' + e)
                  error = true
                  await nightmare.end()
                })

              if (!error) {
                const notconected = await nightmare
                  .wait('#micromike')
                  .evaluate(() => {
                    return !!document.querySelector('#register-confirm-email')
                      || !!document.querySelector('form input[name="username"]')
                      || !!document.querySelector('.alert-warning')
                  })

                await console.log(notconected)

                if (notconected) {
                  if (captchaisNew && ++tryCaptcha < 3) {
                    anticaptcha(true, nightmare)
                  }
                  else {
                    fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
                      if (err) return console.log(err);
                    });
                    await nightmare.end()
                  }
                }
                else {
                  await nightmare.goto('https://www.spotify.com/ie/account/overview')
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

const play = () => {
  const timeout = 1000

  let inter = setInterval(() => {
    if (document.querySelector('.cover-art-playback.playing')) {
      clearInterval(inter)
      return
    }

    // let play = '.tracklist-top-align'
    // let play = '.tracklist-middle-align'
    // let play = '.btn-green'
    let play = '.cover-art-playback:not(.playing)'
    document.querySelector(play) && document.querySelector(play).click()

    setTimeout(() => {
      let shuffle = '.spoticon-shuffle-16:not(.control-button--active)'
      document.querySelector(shuffle) && document.querySelector(shuffle).click()
    }, timeout + 1000);

    setTimeout(() => {
      let repeat = '.spoticon-repeat-16:not(.control-button--active)'
      document.querySelector(repeat) && document.querySelector(repeat).click()
    }, timeout + 2000);

  }, timeout)

  return true
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
  let logError

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: !session,
    waitTimeout: process.env.ADD ? 1000 * 60 * 10 : 1000 * 60,
    show: true,
    width: 600,
    height: 600,
    typeInterval: 300,
    webPreferences: {
      partition: persist,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      images: false,
      experimentalFeatures: true
    }
  })

  try {
    if (process.env.ADD) {
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

      if (isnew) {
        anticaptcha(true, nightmare)

        if (dealer < 5) {
          dealer++
          main()
        }

        await nightmare
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
          .evaluate(() => {
            document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', '<div id="doneform"></div>')
          })

        const urlactivate = await nightmare
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
              // main()
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
        anticaptcha(false, nightmare)

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
    }

    await nightmare
      .goto(album())

    if (process.env.TEST && dealer < size) {
      main(sessionsbis[dealer++])
    }

    await nightmare
      .wait('.cover-art-playback')
      .evaluate(play)
      .then()
      .catch(async (e) => {
        console.log('catch play ' + e)
        sessions = sessions.filter(a => a !== session)
        fs.writeFile('sessions.txt', sessions.join(','), function (err) {
          if (err) return console.log(err);
        });
        await nightmare.end()
      })

    let time
    let time2
    let freeze = 0
    let freezed

    let interloop = setInterval(async () => {
      if (time && time === time2) {
        freeze++
      }
      else {
        freeze = 0
      }

      if (freeze === 4) {
        freezed = true
        freeze = 0
      }
      else {
        freezed = false
      }

      time2 = time
      time = await nightmare
        .evaluate((freezed) => {
          document.querySelector('.btn-green').style.backgroundColor = freezed ? 'red' : 'green'
          return document.querySelector('.playback-bar__progress-time') && document.querySelector('.playback-bar__progress-time').innerHTML
        }, freezed)
        .then()
        .catch(async (e) => {
          console.log(e)
          clearInterval(interloop)
        })
    }, 1000 * 30);

    setTimeout(async () => {
      clearInterval(interloop)
      if (process.env.TEST) {
        let switchAccount = sessions.shift()
        sessions.push(switchAccount)
        await nightmare.end(() => {
          main(switchAccount)
        })
        return
      }
    }, 1000 * 60 * 15);
  }
  catch (e) {
    console.log('global catch ' + e)
    await nightmare.end()
    setTimeout(() => {
      main(persist)
    }, 2600);
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
      sessionsbis = data.split(',')
    }

    if (process.env.TEST) {
      size = sessions.length
      console.log(size)
      let time = 0
      main(sessionsbis[dealer++])
    }

    if (process.env.ADD) {
      main()
    }
  });
});
