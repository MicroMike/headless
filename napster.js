// 33b3uacmtr85cgy1bknuresz
// 54rvonh1epujcohv8oqefqlr
// EUX0XJ8RP2MLB84KHYESIMH

const fs = require('fs');
let accounts = []
let accountsValid = []
let over = false
let countTimeout = 0
let countTimeoutFreeze = 0
let finish = false
const max = 20
const pause = 30

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

const main = async (restartAccount, timeout) => {
  let albums = []
  const album = () => albums[rand(albums.length)]
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
    waitTimeout: 1000 * 60,
    gotoTimeout: 1000 * 59,
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
  let loggedDom
  let usernameInput
  let goToLogin

  let errorLog = false
  let connected = false
  let suppressed = false

  try {
    if (player === 'napster') {
      url = 'https://app.napster.com/login/'

      usernameInput = true
      username = '#username'
      password = '#password'
      loginBtn = '.signin'

      loggedDom = playBtn = '.track-list-header .shuffle-button'
      shuffle = '.repeat-button.off'

      albums = [
        'https://app.napster.com/artist/honey/album/just-another-emotion',
        'https://app.napster.com/artist/yokem/album/boombeats',
        'https://app.napster.com/artist/hanke/album/new-york-story',
        'https://app.napster.com/artist/hanke/album/100-revenge',
        'https://app.napster.com/artist/yonne/album/loser'
      ]
    }
    if (player === 'amazon') {
      url = 'https://music.amazon.fr/gp/dmusic/cloudplayer/forceSignIn'
      loggedDom = '.playbackActive'

      username = '#ap_email'
      password = '#ap_password'
      remember = '[name="rememberMe"]'
      loginBtn = '#signInSubmit'
      usernameInput = false

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
    }
    if (player === 'tidal') {
      url = 'https://listen.tidal.com/'

      username = '#email'
      password = '[name="password"]'
      loginBtn = '.login-cta'
      usernameInput = true
      goToLogin = '#sidebar section button + button'

      playBtn = '.playerIconPlayRing'
      pauseBtn = '.playerIconPauseRing'
      shuffleBtn = '.shuffleButton:not(.on)'
      repeatBtn = '.repeatButton:not(.on)'

      albums = [
        'https://listen.tidal.com/album/93312939',
        // 'https://listen.tidal.com/album/93312939',
        // 'https://listen.tidal.com/album/93312939',
        // 'https://listen.tidal.com/album/93312939',
        // 'https://listen.tidal.com/album/93312939',
      ]
    }

    if (player === 'tidal') {
      await nightmare
        .goto(url)
        .wait(4000 + rand(2000))
        .click(goToLogin)
        .wait(4000 + rand(2000))
        .insert(username, login)
        .wait(4000 + rand(2000))
        .click(username + ' + button')
        .wait(4000 + rand(2000))
        .insert(password, pass)
        .click(password + ' + button')
        .then()
        .catch(async (e) => {
          console.log(e)
          errorLog = true
        })

      if (errorLog) { throw 'out' }
    }

    if (player === 'amazon') {
      connected = await nightmare
        .goto(album())
        .wait(4000 + rand(2000))
        .click(playBtn)
        .wait(2000 + rand(2000))
        .click(pauseBtn)
        .evaluate((loggedDom) => {
          return document.querySelector(loggedDom)
        }, loggedDom)
        .then()
        .catch(async (e) => {
          // console.log('catch logged')
          errorLog = true
        })

      if (errorLog) { throw 'out' }
    }

    if (!connected && player !== 'tidal') {
      suppressed = await nightmare
        .goto(url)
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
          errorLog = true
        })

      if (suppressed) { throw 'del' }
      if (errorLog) { throw 'out' }

      await nightmare
        .goto(album())
        .then()
        .catch(async (e) => {
          // console.log('catch login timeout')
          errorLog = true
        })

      if (errorLog) { throw 'out' }
    }
    // }

    // if (!connected) {
    const issue = await nightmare
      .wait(4000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.unradio') && document.querySelector('.unradio').innerHTML ||
          document.querySelector('.account-issue') && document.querySelector('.account-issue').innerHTML
      })
      .then()
      .catch(async (e) => {
        // console.log('catch account type')
        errorLog = true
      })

    if (errorLog) { throw 'out' }
    if (issue) {
      if (restartAccount) {
        console.log('out issue', account)
      }
      throw 'del'
    }
    // }

    await nightmare
      .wait(2000 + rand(2000))
      .click(playBtn)
      .then()
      .catch(async (e) => {
        // console.log('catch album')
        errorLog = true
      })

    if (errorLog) { throw 'out' }

    if (player === 'napster') {
      await nightmare
        .wait(2000 + rand(2000))
        .evaluate(() => {
          const clickLoop = () => {
            setTimeout(() => {
              document.querySelector('.repeat-button').click()
              if (!document.querySelector('.repeat-button.repeat')) {
                clickLoop()
              }
            }, 2600);
          }

          if (document.querySelector('.repeat-button') && !document.querySelector('.repeat-button.repeat')) {
            clickLoop()
          }
        })
        .then()
        .catch(async (e) => {
          // console.log('catch album')
          errorLog = true
        })

      if (errorLog) { throw 'out' }
    }

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
          errorLog = true
        })

      if (errorLog) { throw 'out' }
    }

    if (check) {
      await nightmare.end()
    }
    else {
      let t1
      let t2
      let freeze = 1
      let totalFreeze = 0
      let isChanging = false
      let time = 0

      let inter = setInterval(async () => {
        if (over) { return clearInterval(inter) }

        const ifCatch = async (e) => {
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.screenshot(player + '.' + login + '.png')
          await nightmare.end()
          console.log("ERROR freeze ", account, e)
        }

        const tryChange = async () => {
          totalFreeze = 0
          await nightmare
            .goto(album())
            .wait(1000 * 30)
            .wait(2000 + rand(2000))
            .click(playBtn)
            .then()
            .catch(ifCatch)
        }

        time += 1000 * 15

        if (time > 1000 * 60 * 30 + rand(1000 * 60 * 30)) {
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.end()
          return
        }

        if (player === 'amazon') {
          if (time / freeze > 1000 * 60 * 10) {
            freeze++
            tryChange()
          }
          return
        }

        const used = await nightmare
          .evaluate(() => {
            return document.querySelector('.player-error-box') && document.querySelector('.player-error-box').innerHTML
          })

        if (used) {
          clearInterval(inter)
          // console.log("ERROR used ", account)
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
              .click(t1 === '0%' ? '.player-play-button .icon-pause2' : '.player-play-button .icon-next2')
              .wait(2000 + rand(2000))
              .click(t1 === '0%' ? '.player-play-button .icon-play-button' : 'body')
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

    if (e !== 'del') {
      accounts.push(account)
      console.log("ERROR ", account)
    }
    else {
      console.log("ERROR ", login, e)

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

    if (player !== 'tidal') {
      await nightmare.end()
    }
  }
}

const mainInter = setInterval(() => {
  if (over) { return clearInterval(mainInter) }
  main()
}, 1000 * pause);

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  accounts = data.split(',')
  // accounts = shuffle(accounts)
  console.log(accounts.length)
  main()
});

process.on('SIGINT', function (code) {
  over = true
  fs.writeFile('napsterAccount.txt', accountsValid.concat(accounts).join(','), function (err) {
    if (err) return console.log(err);
  });
});
