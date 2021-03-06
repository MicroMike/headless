const request = require('ajax-request');
const fs = require('fs');
const util = require('util')

process.env.FILE = process.env.FILE || 'spotifyAccount.txt'

let divided = process.env.DIVIDED || 3
let over = false
let accounts = []
let accountsValid = []
let sessions = []
let sessionsbis = []
let size
let dealer = 1
let list = []
let increment = (val) => {
  return val % divided === 0
    ? val - (divided - 1)
    : ++val
}

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

const albums = [
  'https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX',
  'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
  'https://open.spotify.com/album/6vvfbzMU2dkFQRJiP99RS4',
  'https://open.spotify.com/album/5ceAg32Kt8ta6U7qWYPesW',
  // 'https://open.spotify.com/album/3OCGq91kV8ZtN5qDUI1XA9',
  // 'https://open.spotify.com/album/45is933jCRlQOt6km073H5'
]
const album = () => albums[rand(albums.length)]

const anticaptcha = (captchaisNew, nightmare, currentDealer, tryCaptcha = 0) => {
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
                    document.getElementById('register-button-email-submit').click()
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
                  await nightmare.end(() => {
                    if (currentDealer) {
                      setTimeout(() => {
                        main(null, currentDealer, true)
                      }, 1000 * 60 * 15)
                    }
                  })
                })

              if (!error) {
                const notconected = await nightmare
                  .wait(2000 + rand(2000))
                  .evaluate(() => {
                    return !!document.getElementById('g-recaptcha-response')
                  })

                if (notconected) {
                  if (captchaisNew && ++tryCaptcha < 3) {
                    anticaptcha(true, nightmare, currentDealer, tryCaptcha)
                  }
                  else {
                    fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
                      if (err) return console.log(err);
                    });
                    await nightmare.end()
                  }
                }
                else {
                  if (tryCaptcha > 1) {
                    console.log('pass with' + tryCaptcha + 'tries')
                  }
                  await nightmare.goto('https://www.spotify.com/ie/account/overview')
                }
              }
            }
          }
          catch (e) {
            console.log('catch captcha 2 ' + e)
            console.log(util.inspect(response, false, null, true /* enable colors */))
            clearInterval(interval)
            if (nightmare) {
              anticaptcha(true, nightmare, currentDealer, tryCaptcha)
            }
          }
        });
      }
      catch (e) {
        console.log('catch captcha 3 ' + e)
        console.log(util.inspect(response, false, null, true /* enable colors */))
        clearInterval(interval)
        if (nightmare) {
          anticaptcha(true, nightmare, currentDealer, tryCaptcha)
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

const main = async (session, currentDealer, tempAdd) => {
  if (over) { return }
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
  let id

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: !session,
    waitTimeout: process.env.ADD || tempAdd ? 1000 * 60 * 10 : 1000 * 60,
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

  currentDealer = currentDealer || dealer

  // if (process.env.TEST) {
  //   id = Math.ceil(currentDealer / divided)
  //   if (list[id] && list[id] === divided) {
  //     return
  //   }
  // }

  try {
    if (process.env.ADD || tempAdd) {
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
              main(tempAdd ? null : session, currentDealer, tempAdd)
            })
          })
        : accounts.shift()

      accountInfo = account.split(':')
      player = accountInfo[0]
      login = accountInfo[1]
      pass = accountInfo[2]

      if (dealer < 15 && !tempAdd) {
        dealer++
        main()
      }

      if (isnew) {
        anticaptcha(true, nightmare, currentDealer)

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
          .then()
          .catch(async (e) => {
            console.log('catch doneform')
            logError = true
            await nightmare.end(() => {
              // main()
            })
          })

        if (logError) {
          return
        }

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
          .evaluate(() => {
            document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', '<div id="doneform"></div>')
          })
          .then()
          .catch(async (e) => {
            console.log('catch doneform')
            logError = true
            await nightmare.end(() => {
              // main()
            })
          })

        if (logError) {
          return
        }

        await nightmare
          .wait('.logout-link')
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
        if (tempAdd) {
          console.log('replace session')
          sessions[currentDealer] = persist
        }
        else {
          sessions.push(persist)
        }
        fs.writeFile('sessions.txt', sessions.filter(s => s).join(','), function (err) {
          if (err) return console.log(err);
        });
      }
    }

    await nightmare
      .goto(album())

    if (process.env.TEST && !tempAdd) {
      if (dealer < size - divided) {
        dealer += divided
        list[dealer] = 0
        setTimeout(() => {
          main(sessions[dealer])
        }, 1000);
      }

      const out = await nightmare
        .wait(2000 + rand(2000))
        .evaluate(() => {
          return !!document.getElementById('signup-spotify') || !document.querySelector('.UserWidget__user-link')
        })

      if (out) {
        await nightmare.end(() => {
          // console.log('out ' + id)
          // list[id] = list[id] + 1
          // sessionsbis = sessionsbis.filter(a => a !== session)
          // fs.writeFile('sessions.txt', sessionsbis.join(','), function (err) {
          //   if (err) return console.log(err);
          // });
          console.log('out ' + session, currentDealer)
          main(null, currentDealer, true)
          // currentDealer = increment(currentDealer)
          // main(sessions[currentDealer], currentDealer)
        })
        return
      }
      else {
        list[id] = 0
      }
    }

    await nightmare
      .wait('.cover-art-playback')
      .evaluate(play)
      .then()
      .catch(async (e) => {
        console.log('catch play ' + e)
        logError = true
        await nightmare.end(() => {
          currentDealer = increment(currentDealer)
          main(sessions[currentDealer], currentDealer)
        })
      })

    if (logError) {
      return
    }

    let time
    let time2
    let freeze = 0
    let freezed

    // let interloop = setInterval(async () => {
    //   if (time && time === time2) {
    //     freeze++
    //   }
    //   else {
    //     freeze = 0
    //   }

    //   if (freeze === 4) {
    //     freezed = true
    //     freeze = 0
    //   }
    //   else {
    //     freezed = false
    //   }

    //   time2 = time
    //   time = await nightmare
    //     .evaluate((freezed) => {
    //       document.querySelector('.btn-green').style.backgroundColor = freezed ? 'red' : 'blue'
    //       return document.querySelector('.playback-bar__progress-time') && document.querySelector('.playback-bar__progress-time').innerHTML
    //     }, freezed)
    //     .then()
    //     .catch(async (e) => {
    //       console.log(e)
    //       clearInterval(interloop)
    //     })
    // }, 1000 * 30);

    if (process.env.TEST) {
      setTimeout(async () => {
        // clearInterval(interloop)
        await nightmare.end()
        setTimeout(() => {
          currentDealer = increment(currentDealer)
          main(sessions[currentDealer], currentDealer)
        }, 1000);
        return
      }, 1000 * 60 * (10 + rand(10)));
    }
  }
  catch (e) {
    console.log('global catch ' + e)
    await nightmare.end()
    setTimeout(() => {
      if (!tempAdd) {
        currentDealer = increment(currentDealer)
      }
      main(sessions[currentDealer], currentDealer)
    }, 2600);
  }
}

fs.readFile(process.env.FILE, 'utf8', function (err, data) {
  if (err) return console.log(err);
  if (data) {
    accounts = data.split(',')
  }

  fs.readFile('sessions.txt', 'utf8', function (err, data) {
    try {
      if (err) return console.log(err);
      if (data) {
        data = shuffle(data)
        sessions = data.split(',')
        sessionsbis = data.split(',')
      }

      if (process.env.TEST) {
        size = sessions.length - sessions.length % divided
        console.log(size)
        sessions.unshift('')
        let time = 0
        list[dealer] = 0
        main(sessions[dealer])
      }

      if (process.env.ADD) {
        main()
      }
    }
    catch (e) {
      console.log(e)
    }
  });
});

process.on('SIGINT', function (code) {
  over = true
});