// 33b3uacmtr85cgy1bknuresz
// 54rvonh1epujcohv8oqefqlr
// EUX0XJ8RP2MLB84KHYESIMH

const fs = require('fs');
const request = require('ajax-request');
const check = process.env.CHECK
let accounts = []
let accountsValid = []
let over = false
let countTimeout = 0
let countTimeoutFreeze = 0
let finish = true
const max = 20
const pause = check ? 10 : 30

const getTime = () => {
  const date = new Date
  return date.getUTCHours() + 1 + 'H' + date.getUTCMinutes()
}

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

function shuffle(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr.sort(() => { return rand(2) })
  }
  return arr
}

const anticaptcha = (websiteURL, websiteKey, invisible = false) => {
  return new Promise((resolve, reject) => {
    request({
      url: 'https://api.anti-captcha.com/createTask',
      method: 'POST',
      json: true,
      data: {
        clientKey: '0cab7e41bab98900c321592426ec2183',
        task: {
          type: 'NoCaptchaTaskProxyless',
          websiteURL,
          websiteKey,
          invisible
        }
      }
    }, function (err, res, response) {
      if (!response || !response.taskId) {
        console.log(response || 'no response')
        resolve('error')
        return;
      }

      const interval = setInterval(() => {
        if (over) { return clearInterval(interval) }
        request({
          url: 'https://api.anti-captcha.com/getTaskResult',
          method: 'POST',
          json: true,
          data: {
            clientKey: '0cab7e41bab98900c321592426ec2183',
            taskId: response.taskId
          }
        }, function (err, res, response) {
          try {
            if (response && response.status !== 'processing') {
              clearInterval(interval)
              resolve(response.solution.gRecaptchaResponse)
            }
            else if (!response) {
              throw 'error'
            }
          }
          catch (e) {
            console.log(response || 'no response B')
            clearInterval(interval)
            resolve('error')
            return;
          }
        });
      }, 1000 * 30)
    });
  })
}

const main = async (restartAccount) => {
  finish = false
  let albums = []
  let currentAlbum
  const album = () => {
    let albumUrl = albums[rand(albums.length)]
    while (currentAlbum === albumUrl) {
      albumUrl = albums[rand(albums.length)]
    }
    currentAlbum = albumUrl
    return albumUrl
  }
  if (over) { return }
  if (!restartAccount) {
    if (!accounts[0]) {
      console.log('Pas de comptes')
      return
    }
    if (accountsValid.length >= accounts.length || accountsValid.length >= max) { return }
  }
  // let session = persist || 'persist: ' + Date.now()
  let account = restartAccount || accounts[0]
  accounts = accounts.filter(a => a !== account)

  accountsValid = accountsValid.filter(a => a !== account)
  accountsValid.push(account)

  let inter

  accountInfo = account.split(':')
  const player = accountInfo[0]
  const login = accountInfo[1]
  const pass = accountInfo[2]
  const logged = accountInfo[3] || null

  // account += !logged ? ':' + session : ''

  const webPreferences = {
    partition: 'persist: ' + player + ':' + login,
    webSecurity: false,
    allowRunningInsecureContent: true,
    plugins: true,
    images: process.env.TEST,
    experimentalFeatures: true
  }

  if (player === 'napster') {
    // delete webPreferences.partition
  }

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    openDevTools: process.env.TEST,
    alwaysOnTop: false,
    waitTimeout: 1000 * 60 * 3,
    gotoTimeout: 1000 * 59 * 3,
    show: true,
    typeInterval: 300,
    webPreferences
  })

  let username
  let password
  let url
  let remember
  let loginBtn
  let playBtn
  let pauseBtn
  let shuffleBtn
  let repeatBtn
  let repeatBtnOk
  let loggedDom
  let usernameInput
  let goToLogin
  let keyCaptcha
  let usedDom
  let reLog
  let loginError

  let errorLog = false
  let connected = false
  let suppressed = false

  try {
    if (player === 'napster') {
      url = 'https://app.napster.com/login/'
      loggedDom = '.track-list-header .shuffle-button'

      username = '#username'
      password = '#password'
      loginBtn = '.signin'
      loginError = '.login-error'

      playBtn = '.track-list-header .shuffle-button'
      repeatBtn = '.repeat-button'
      repeatBtnOk = '.repeat-button.repeat'

      albums = [
        'https://app.napster.com/artist/honey/album/just-another-emotion',
        'https://app.napster.com/artist/yokem/album/boombeats',
        'https://app.napster.com/artist/hanke/album/new-york-story',
        'https://app.napster.com/artist/hanke/album/100-revenge',
        'https://app.napster.com/artist/yonne/album/loser'
      ]

      usedDom = '.player-error-box'
    }
    if (player === 'amazon') {
      url = 'https://music.amazon.fr/gp/dmusic/cloudplayer/forceSignIn'
      loggedDom = '.actionSection.settings'

      username = '#ap_email'
      password = '#ap_password'
      remember = '[name="rememberMe"]'
      loginBtn = '#signInSubmit'

      playBtn = '.playerIconPlayRing'
      pauseBtn = '.playerIconPauseRing'
      shuffleBtn = '.shuffleButton:not(.on)'
      repeatBtn = '.repeatButton:not(.on)'

      albums = [
        'https://music.amazon.fr/albums/B07G9RM2MG',
        'https://music.amazon.fr/albums/B07CZDXC9B',
        'https://music.amazon.fr/albums/B07D3NQ235',
        'https://music.amazon.fr/albums/B07G5PPYSY',
        'https://music.amazon.fr/albums/B07D3PGSR4',
      ]

      usedDom = '.concurrentStreamsPopover'
    }
    if (player === 'tidal') {
      url = 'https://listen.tidal.com/'

      username = '#email'
      password = '[name="password"]'
      loginBtn = '.login-cta'
      goToLogin = '#sidebar section button + button'

      playBtn = '[class*="controls"] button + button'
      pauseBtn = '.playerIconPauseRing'
      repeatBtn = '[class*="repeatButton"]'
      repeatBtnOk = '[class*="repeatStateIcon"][class*="all"]'

      keyCaptcha = '6Lf-ty8UAAAAAE5YTgJXsS3B-frcWP41G15z-Va2'

      albums = [
        'https://listen.tidal.com/album/93312939',
        'https://listen.tidal.com/album/93087422',
        'https://listen.tidal.com/album/88716570',
        'https://listen.tidal.com/album/88041212'
      ]

      usedDom = '.WARN'
      reLog = 'body > div > div > div > div > div > div > div > button'
    }
    if (player === 'spotify') {
      url = 'https://accounts.spotify.com/login'
      loggedDom = '.sessionInfo'

      username = 'form input[name="username"]'
      password = 'form input[name="password"]'
      loginBtn = '#login-button'
      loginError = '.alert.alert-warning'

      playBtn = '.tracklist-play-pause.tracklist-middle-align'
      repeatBtn = '[class*="spoticon-repeat"]'
      repeatBtnOk = '.spoticon-repeat-16.control-button--active'
      shuffleBtn = '.spoticon-shuffle-16:not(.control-button--active)'

      keyCaptcha = '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo'

      albums = [
        'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
        'https://open.spotify.com/album/5509gS9cZUrbTFege0fpTk',
      ]
      usedDom = '.ConnectBar'
    }

    const resolveCaptcha = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          let errorLog
          const needCaptcha = await nightmare
            .evaluate(() => {
              return window.___grecaptcha_cfg.clients[0] ? location.href : false
            })
            .then()
            .catch(async (e) => {
              return null
            })

          if (!needCaptcha) { return resolve('click') }

          const captcha = await anticaptcha(needCaptcha, keyCaptcha, true)
          console.log(captcha)
          if (captcha === 'error') { return resolve('error') }

          await nightmare
            .evaluate((captcha) => {
              setTimeout(() => {
                let clients = window.___grecaptcha_cfg.clients[0]
                Object.keys(clients).map(key => {
                  let client = clients[key]
                  Object.keys(client).map(k => {
                    let l = client[k]
                    l && l.callback && l.callback(captcha)
                  })
                })
              }, 5000);
            }, captcha)
            .then()
            .catch(async (e) => {
              errorLog = e
            })

          if (errorLog) {
            return resolve(errorLog)
          }
          // resolve('done')
        }
        catch (e) {
          console.log(e)
          resolve('error')
        }
      })
    }

    // ***************************************************************************************************************************************************************
    // *************************************************************************** CONNECT ***************************************************************************
    // ***************************************************************************************************************************************************************

    if (player === 'tidal') {
      let notConnected = await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .exists(goToLogin)

      if (errorLog) { throw errorLog }

      if (notConnected) {
        const done = await nightmare
          .click(goToLogin)
          .wait(6000 + rand(2000))
          .exists(reLog)

        if (errorLog) { throw errorLog }

        if (done) {
          await nightmare
            .click(reLog)
            .wait(2000 + rand(2000))
        }
        else {
          await nightmare
            .wait(6000 + rand(2000))
            .insert(username, login)
            .wait(2000 + rand(2000))
            .then()
            .catch(async (e) => {
              errorLog = 'A' + e
            })

          if (errorLog) { throw errorLog }

          const validCallback = await resolveCaptcha()
          console.log(validCallback)
          if (validCallback === 'click') {
            await nightmare
              .click('#recap-invisible')
              .then()
              .catch(async (e) => {
                errorLog = 'A2' + e
              })

            if (errorLog) { throw errorLog }
          }
          else if (validCallback !== 'done') { throw validCallback }

          await nightmare
            .wait(2000 + rand(2000))
            .wait(password)
            .wait(2000 + rand(2000))
            .insert(password, pass)
            .wait(2000 + rand(2000))
            .click('body > div > div > div > div > div > div > div > form > button')
            .then()
            .catch(async (e) => {
              // errorLog = 'C' + e
              const validCallback = await resolveCaptcha()
              if (validCallback === 'click' && validCallback !== 'done') { return errorLog = 'C' + e }
              await nightmare
                .wait(2000 + rand(2000))
                .wait(password)
                .wait(2000 + rand(2000))
                .insert(password, pass)
                .wait(2000 + rand(2000))
                .click('body > div > div > div > div > div > div > div > form > button')
            })

          if (errorLog) { throw errorLog }
        }
      }

      await nightmare
        .wait(6000 + rand(2000))
        .goto(album())
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = 'D' + e
        })

      if (errorLog) { throw errorLog }
    }

    if (player === 'amazon' || player === 'napster' || player === 'spotify') {
      connected = await nightmare
        .goto(album())
        .wait(2000 + rand(2000))
        .exists(loggedDom)
        .then()
        .catch(async (e) => {
          // console.log('catch logged')
          errorLog = 'E' + e
        })

      if (errorLog) { throw errorLog }
    }

    if (!connected && player !== 'tidal') {
      usernameInput = await nightmare
        .goto(url)
        .wait(password)
        .exists(username)
        .then()
        .catch(async (e) => {
          console.log('catch logged')
          if (!(e + '').match(/navigation error/)) {
            errorLog = 'F' + e
          }
        })

      if (errorLog) { throw errorLog }

      await nightmare
        .wait(2000 + rand(2000))
        .insert(usernameInput ? username : password, login)
        .wait(2000 + rand(2000))
        .insert(password, '')
        .insert(password, pass)
        .wait(2000 + rand(2000))
        .click(remember || 'body')
        .wait(2000 + rand(2000))
        .then()
        .catch(async (e) => {
          errorLog = 'G' + e
        })

      if (errorLog) { throw errorLog }

      let validCallback
      if (player === 'spotify') {
        validCallback = await resolveCaptcha()
        if (validCallback !== 'click' && validCallback !== 'done') { throw validCallback }
      }

      if (player !== 'spotify' || validCallback === 'click') {
        await nightmare
          .click(loginBtn)
          .then()
          .catch(async (e) => {
            errorLog = 'I' + e
          })

        if (errorLog) { throw errorLog }
      }

      finish = true

      suppressed = await nightmare
        .wait(1000 * 15)
        .wait(2000 + rand(2000))
        .exists(loginError)
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = 'J' + e
        })

      if (suppressed) { throw 'del' }
      if (errorLog) { throw errorLog }

      await nightmare
        .goto(album())
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = 'K' + e
        })

      if (errorLog) { throw errorLog }
    }
    // }

    if (player === 'napster') {
      const issue = await nightmare
        .wait(4000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('.unradio') && document.querySelector('.unradio').innerHTML ||
            document.querySelector('.account-issue') && document.querySelector('.account-issue').innerHTML
        })
        .then()
        .catch(async (e) => {
          // console.log('catch account type')
          errorLog = 'L' + e
        })

      if (errorLog) { throw errorLog }
      if (issue) { throw 'del' }
    }

    if (check) {
      await nightmare.end()
      return
    }

    // ***************************************************************************************************************************************************************
    // *************************************************************************** PLAY ******************************************************************************
    // ***************************************************************************************************************************************************************

    if (player === 'amazon') {
      await nightmare
        .wait(2000 + rand(2000))
        .evaluate((btn) => {
          document.querySelector(btn.shuffleBtn) && document.querySelector(btn.shuffleBtn).click()
          document.querySelector(btn.repeatBtn) && document.querySelector(btn.repeatBtn).click()
        }, { shuffleBtn, repeatBtn })
        .then()
        .catch(async (e) => {
          // console.log('catch album')
          errorLog = 'M' + e
        })

      if (errorLog) { throw errorLog }
    }

    let stopBeforePlay
    if (player === 'spotify') {
      stopBeforePlay = await nightmare
        .wait(4000 + rand(2000))
        .exists(usedDom)
    }

    if (!stopBeforePlay) {
      await nightmare
        .wait(playBtn)
        .wait(2000 + rand(2000))
        .click(playBtn)
        .then()
        .catch(async (e) => {
          // console.log('catch album')
          errorLog = 'N' + e
        })

      if (errorLog) { throw errorLog }

      if (player === 'napster' || player === 'tidal' || player === 'spotify') {
        await nightmare
          .wait(repeatBtn)
          .wait(2000 + rand(2000))
          .evaluate((btn) => {
            const clickLoop = () => {
              document.querySelector(btn.repeatBtn).click()
              setTimeout(() => {
                if (!document.querySelector(btn.repeatBtnOk)) {
                  clickLoop()
                }
              }, 2600);
            }

            if (document.querySelector(btn.repeatBtn) && !document.querySelector(btn.repeatBtnOk)) {
              clickLoop()
            }

            document.querySelector(btn.shuffleBtn) && document.querySelector(btn.shuffleBtn).click()

          }, { repeatBtn, repeatBtnOk, shuffleBtn })
          .then()
          .catch(async (e) => {
            // console.log('catch album')
            errorLog = 'O' + e
          })

        if (errorLog) { throw errorLog }
      }
    }

    // ***************************************************************************************************************************************************************
    // *************************************************************************** LOOP ******************************************************************************
    // ***************************************************************************************************************************************************************

    let t1
    let t2
    let freeze = 1
    let isChanging = false
    let time = 0
    let time2 = 0
    let inter
    let fix = false
    let used
    let changeInterval

    const ifCatch = async (e) => {
      clearInterval(inter)
      clearInterval(changeInterval)
      accountsValid = accountsValid.filter(a => a !== account)
      accounts.push(account)
      await nightmare.screenshot('freeze.' + player + '.' + login + '.png')
      await nightmare.end()
      console.log("ERROR freeze ", account, (e + ' ').split(' at')[0])
    }

    changeInterval = setInterval(async () => {
      if (over) { return clearInterval(changeInterval) }

      const playExist = await nightmare
        .goto(album())

      countTimeout++

      for (let i = 0; i < countTimeout; i++) {
        await nightmare
          .wait(1000 * 30)
      }

      await nightmare
        .wait(2000 + rand(2000))
        .exists(playBtn)

      countTimeout--

      if (!playExist) {
        await nightmare
          .screenshot('aaa.' + player + '.' + login + '.png')
        ifCatch('catch no play')
        return
      }

      await nightmare
        .wait(2000 + rand(2000))
        .click(playBtn)
        .then()
        .catch((e) => {
          ifCatch('P2' + e)
        })
    }, process.env.TEST ? 1000 * 60 : 1000 * 60 * 10 + rand(1000 * 60 * 15));

    const restart = async (timeout = 0) => {
      clearInterval(changeInterval)
      clearInterval(inter)
      accountsValid = accountsValid.filter(a => a !== account)
      setTimeout(() => {
        accounts.push(account)
      }, timeout);
      await nightmare.end()
    }

    let restartTimeout = setTimeout(() => {
      if (over) { return clearTimeout(restartTimeout) }
      restart()
    }, 1000 * 60 * 30 + rand(1000 * 60 * 30));

    inter = setInterval(async () => {
      if (over) { return clearInterval(inter) }

      used = await nightmare
        .exists(usedDom)
        .then()
        .catch((e) => {
          ifCatch('Q' + e)
        })

      if (used) {
        used = await nightmare
          .evaluate((usedDom) => {
            return document.querySelector(usedDom) && document.querySelector(usedDom).innerHTML
          }, usedDom)
          .then()
          .catch((e) => {
            ifCatch('Q2' + e)
          })

        if (player === 'tidal') {
          used = typeof used === 'string' && used.match(/currently/) ? used : false

          if (!used) {
            await nightmare.click('#wimp > div > div > div > div > div > button')
          }
        }
      }

      if (player === 'napster') {
        t1 = await nightmare
          .evaluate(() => {
            const time = '.player-progress-slider-box span.ui-slider-handle'
            return document.querySelector(time).style.left
          })
          .then()
          .catch(async (e) => {
            return 'no bar'
          })


        if (t2 && t1 === t2) {
          freeze++
        }
        else {
          freeze = 0
        }

        if (freeze >= 2) {
          freeze = 0

          if (t1 === 'no bar') {
            fix = true
          }
          else {
            const isPause = await nightmare
              .exists('.player-play-button .icon-pause2')

            if (isPause) {
              await nightmare
                .click('.player-play-button .icon-pause2')
                .wait(2000 + rand(2000))
                .click('.player-play-button .icon-play-button')
                .then()
                .catch((e) => {
                  ifCatch('R' + e)
                })
            }
          }
        }

        t2 = t1
      }

      if (used || fix) {
        if (used) {
          await nightmare.screenshot('used.' + player + '.' + login + '.png')
          console.log(getTime() + ' used', account)
        }
        restart(used ? 1000 * 60 * 60 : 0)
        return
      }
    }, 1000 * 30)
  }
  catch (e) {
    finish = true
    accountsValid = accountsValid.filter(a => a !== account)

    console.log(getTime() + " ERROR ", account, check ? e : (e + ' ').split(' at')[0])
    await nightmare.screenshot('throw.' + player + '.' + login + '.png')

    if (e !== 'del') {
      accounts.push(account)
    }
    else {
      fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
        if (err) return console.log(err);
        data = data.split(',')
        data = data.filter(a => a !== account)
        data.push(account)
        fs.writeFile('napsterAccountDel.txt', data.join(','), function (err) {
          if (err) return console.log(err);
        });
      });
    }

    // if (player !== 'tidal') {
    await nightmare.end()
    // }
  }
}

const mainInter = setInterval(() => {
  if (over || process.env.TEST) { return clearInterval(mainInter) }
  try {
    // if (finish) {
    main()
    // }
  }
  catch (e) {
    console.log('ZEUB')
  }
}, 1000 * pause);

let file = process.env.FILE || 'napsterAccount.txt'
file = check ? 'check.txt' : file

fs.readFile(file, 'utf8', async (err, data) => {
  if (err) return console.log(err);
  accounts = data = data.split(',')

  if (!process.env.FILE) {
    const split = parseInt(data.length / 2)
    if (process.env.BEGIN === '2') {
      accounts = data.slice(split)
    }
    else {
      accounts = data.slice(0, split)
    }
  }

  accounts = process.env.RAND ? shuffle(accounts) : accounts
  console.log(accounts.length)
  main()
});

process.on('SIGINT', function (code) {
  over = true
});
