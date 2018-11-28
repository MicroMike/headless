// 33b3uacmtr85cgy1bknuresz
// 54rvonh1epujcohv8oqefqlr
// EUX0XJ8RP2MLB84KHYESIMH

const fs = require('fs');
const request = require('ajax-request');
let accounts = []
let accountsValid = []
let over = false
let countTimeout = 0
let countTimeoutFreeze = 0
let finish = false
const max = 20
const pause = 45

const check = process.env.CHECK

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
      // console.log(response)
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

const main = async (restartAccount, timeout) => {
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
  finish = true
  if (over) { return }
  if (timeout) { countTimeout-- }
  if (!restartAccount) {
    if (accountsValid.length >= accounts.length || accountsValid.length >= max) { return }
  }
  finish = false
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
    images: false,
    experimentalFeatures: true
  }

  if (player === 'napster') {
    delete webPreferences.partition
  }

  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: true,
    alwaysOnTop: false,
    waitTimeout: 1000 * 60 * 2,
    gotoTimeout: 1000 * 59 * 2,
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

  let errorLog = false
  let connected = false
  let suppressed = false

  try {
    if (player === 'napster') {
      url = 'https://app.napster.com/login/'

      username = '#username'
      password = '#password'
      loginBtn = '.signin'

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
    }
    if (player === 'spotify') {
      url = 'https://accounts.spotify.com/login'

      username = 'form input[name="username"]'
      password = 'form input[name="password"]'
      loginBtn = '#login-button'

      playBtn = '.tracklist-play-pause.tracklist-middle-align'

      keyCaptcha = '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo'
      let albums = [
        'https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX',
        'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
        'https://open.spotify.com/album/6vvfbzMU2dkFQRJiP99RS4',
      ]
    }

    // ***************************************************************************************************************************************************************
    // *************************************************************************** CONNECT ***************************************************************************
    // ***************************************************************************************************************************************************************

    if (player === 'tidal') {
      let notConnected = await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .exists(goToLogin)

      if (notConnected) {
        const tidalUrl = await nightmare
          .click(goToLogin)
          .wait(2000 + rand(2000))
          .insert(username, login)
          .evaluate(() => {
            return document.URL
          })
          .then()
          .catch(async (e) => {
            errorLog = e
          })

        if (errorLog) { throw errorLog }

        const captcha = await anticaptcha(tidalUrl, keyCaptcha, true)
        if (captcha === 'error') { throw captcha }

        await nightmare
          .evaluate((captcha) => {
            let clients = window.___grecaptcha_cfg.clients[0]
            Object.keys(clients).map(key => {
              let client = clients[key]
              Object.keys(client).map(k => {
                let l = client[k]
                l && l.callback && l.callback(captcha)
              })
            })
          }, captcha)
          .then()
          .catch(async (e) => {
            errorLog = e
          })

        if (errorLog) { throw errorLog }

        await nightmare
          .wait(2000 + rand(2000))
          .wait(password)
          .wait(2000 + rand(2000))
          .insert(password, pass)
          .wait(2000 + rand(2000))
          .click(password + ' + button')
          .then()
          .catch(async (e) => {
            errorLog = e
          })

        if (errorLog) { throw errorLog }
      }

      await nightmare
        .wait(6000 + rand(2000))
        .goto(album())
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = e
        })

      if (errorLog) { throw errorLog }
    }

    if (player === 'amazon') {
      connected = await nightmare
        .goto(album())
        .wait(2000 + rand(2000))
        .evaluate((loggedDom) => {
          return document.querySelector(loggedDom)
        }, loggedDom)
        .then()
        .catch(async (e) => {
          // console.log('catch logged')
          errorLog = 'A ' + e
        })

      if (errorLog) { throw errorLog }
    }

    if (!connected && player !== 'tidal') {
      usernameInput = await nightmare
        .goto(url)
        .wait(password)
        .evaluate((username) => {
          return document.querySelector(username)
        }, username)
        .then()
        .catch(async (e) => {
          // console.log('catch logged')
          errorLog = e
        })

      if (errorLog) { throw errorLog }

      suppressed = await nightmare
        .wait(2000 + rand(2000))
        .insert(usernameInput ? username : password, login)
        .wait(2000 + rand(2000))
        .insert(password, '')
        .insert(password, pass)
        .wait(2000 + rand(2000))
        .click(remember || 'body')
        .wait(2000 + rand(2000))
        .click(loginBtn)
        .wait(1000 * 30)
        .wait(2000 + rand(2000))
        .evaluate(() => {
          return document.querySelector('.login-error')
        })
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = e
        })

      if (suppressed) { throw 'del' }
      if (errorLog) { throw errorLog }

      await nightmare
        .goto(album())
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = e
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
          errorLog = e
        })

      if (errorLog) { throw errorLog }
      if (issue) { throw 'del' }
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
          errorLog = e
        })

      if (errorLog) { throw errorLog }
    }

    await nightmare
      .wait(playBtn)
      .wait(2000 + rand(2000))
      .click(playBtn)
      .then()
      .catch(async (e) => {
        // console.log('catch album')
        errorLog = 'B ' + e
      })

    if (errorLog) { throw errorLog }

    if (player === 'napster' || player === 'tidal') {
      await nightmare
        .wait(repeatBtn)
        .wait(2000 + rand(2000))
        .evaluate((btn) => {
          const clickLoop = () => {
            setTimeout(() => {
              document.querySelector(btn.repeatBtn).click()
              if (!document.querySelector(btn.repeatBtnOk)) {
                clickLoop()
              }
            }, 2600);
          }

          if (document.querySelector(btn.repeatBtn) && !document.querySelector(btn.repeatBtnOk)) {
            clickLoop()
          }
        }, { repeatBtn, repeatBtnOk })
        .then()
        .catch(async (e) => {
          // console.log('catch album')
          errorLog = e
        })

      if (errorLog) { throw errorLog }
    }

    if (check) {
      await nightmare.end()
    }
    else {

      // ***************************************************************************************************************************************************************
      // *************************************************************************** LOOP ******************************************************************************
      // ***************************************************************************************************************************************************************

      let t1
      let t2
      let freeze = 1
      let totalFreeze = 0
      let isChanging = false
      let time = 0
      let time2 = 0

      let inter = setInterval(async () => {
        if (over) { return clearInterval(inter) }

        const ifCatch = async (e) => {
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.screenshot('freeze.' + player + '.' + login + '.png')
          await nightmare.end()
          console.log("ERROR freeze ", account, e)
        }

        const tryChange = async () => {
          totalFreeze = 0
          await nightmare
            .goto(album())
            .wait(playBtn)
            .wait(2000 + rand(2000))
            .click(playBtn)
            .then()
            .catch(ifCatch)
        }

        time += 1000 * 15
        time2 += 1000 * 15

        if (time > 1000 * 60 * 30 + rand(1000 * 60 * 30)) {
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.end()
          return
        }

        if (player !== 'napster') {
          if (time2 > 1000 * 60 * 2) {
            time2 = 0
            tryChange()
          }
          return
        }

        const used = await nightmare
          .evaluate((usedDom) => {
            return document.querySelector(usedDom) && document.querySelector(usedDom).innerHTML
          }, usedDom)

        if (used) {
          clearInterval(inter)
          console.log("ERROR used ", account)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.end()
          return
        }

        if (isChanging) {
          return
        }

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
          await nightmare
            .evaluate(() => {
              if (document.querySelector('.main-image .image')) {
                document.querySelector('.main-image .image').style.backgroundColor = 'orange'
              }
            })
            .then()
            .catch((e) => {
            })
        }
        else {
          freeze = 0
          await nightmare
            .evaluate(() => {
              if (document.querySelector('.main-image .image')) {
                document.querySelector('.main-image .image').style.backgroundColor = 'grey'
              }
            })
            .then()
            .catch((e) => {
            })
        }

        if (freeze >= 2) {
          isChanging = true
          freeze = 0

          await nightmare
            .evaluate(() => {
              if (document.querySelector('.main-image .image')) {
                document.querySelector('.main-image .image').style.backgroundColor = 'blue'
              }
            })
            .then()
            .catch((e) => {
            })

          if (t1 === 'no bar') {
            clearInterval(inter)
            console.log('no time bar ', account)
            accountsValid = accountsValid.filter(a => a !== account)
            accounts.push(account)
            await nightmare.end()
            return
          }

          if (++totalFreeze < 10) {
            await nightmare
              .click('.player-play-button .icon-pause2')
              .wait(2000 + rand(2000))
              .click('.player-play-button .icon-play-button')
              .then()
              .catch(ifCatch)
            isChanging = false
          }
          else {
            setTimeout(async () => {
              await tryChange()
              countTimeout--
              isChanging = false
            }, 1000 * pause * ++countTimeout);
          }
        }

        t2 = t1
      }, 1000 * 15)
    }
  }
  catch (e) {
    accountsValid = accountsValid.filter(a => a !== account)

    console.log("ERROR ", account, (e + ' ').split(' at')[0])
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
  if (over) { return clearInterval(mainInter) }
  main()
}, 1000 * pause);

fs.readFile('napsterAccount.txt', 'utf8', async (err, data) => {
  if (err) return console.log(err);
  accounts = data.split(',')
  accounts = process.env.RAND ? shuffle(accounts) : accounts

  const split = parseInt(accounts.length / 2)
  if (process.env.RAND === 1) {
    accounts = accounts.slice(0, split)
  }
  else {
    accounts = accounts.slice(split)
  }
  console.log(accounts.length)
  main()
});

const mail = async () => {
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    openDevTools: true,
    alwaysOnTop: false,
    waitTimeout: 1000 * 60 * 2,
    gotoTimeout: 1000 * 59 * 2,
    show: true,
    typeInterval: 300,
    webPreferences: {
      partition: 'persist: mail',
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      experimentalFeatures: true
    }
  })

  await nightmare
    .goto('https://my.mail.fr')
    .wait('#loginName')
    .wait(2000 + rand(2000))
    .insert('#loginName', 'yokem92')
    .wait(2000 + rand(2000))
    .insert('#loginPassword', 'Yokem123')
    .wait(2000 + rand(2000))
    .click('#loginButton')
    .wait('#loggedOutTip')
    .evaluate(() => {
      const tip = '#loggedOutTip'
      document.querySelector(tip) && document.querySelector(tip).remove()
    })
    .then()
    .catch(() => { })

  const code = await nightmare
    .wait(2000 + rand(2000))
    .click('#dashboardContent .tbody .tr')
    .wait(2000 + rand(2000))
    .evaluate(() => {
      return document.querySelector('.mailViewFrame').contentDocument.body.innerHTML.split(':')[1].split('<br>')[2].trim()
    })

  console.log(code)
}

process.on('SIGINT', function (code) {
  over = true
  fs.writeFile('napsterAccount.txt', accountsValid.concat(accounts).join(','), function (err) {
    if (err) return console.log(err);
  });
});
