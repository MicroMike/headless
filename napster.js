// 33b3uacmtr85cgy1bknuresz
// 54rvonh1epujcohv8oqefqlr
// EUX0XJ8RP2MLB84KHYESIMH

const fs = require('fs');
let accounts = []
let accountsValid = []
let over = false
let albums
let countTimeout = 0
let countTimeoutFreeze = 0

const check = process.env.CHECK

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

const album = () => albums[rand(albums.length)]

const save = (temp) => {
  fs.writeFile('tna.txt', accountsValid.join(','), function (err) {
    if (err) return console.log(err);
  });
}

const main = async (restartAccount, night, timeout) => {
  if (over) { return }
  if (timeout) { countTimeout-- }
  if (!restartAccount) {
    if (accountsValid.length >= accounts.length || accountsValid.length >= 23) { return }
  }
  // let session = persist || 'persist: ' + Date.now()
  let account = restartAccount || accounts[0]
  accounts = accounts.filter(a => a !== account)

  let inter

  accountInfo = account.split(':')
  const player = accountInfo[0]
  const login = accountInfo[1]
  const pass = accountInfo[2]
  const logged = accountInfo[3] || null

  // account += !logged ? ':' + session : ''

  const Nightmare = require('nightmare')
  const nightmare = night || Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 60,
    show: true,
    typeInterval: 300,
    webPreferences: {
      partition: 'persist: ' + login,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      images: false,
      experimentalFeatures: true
    }
  })

  let inputs = {
    username: '#username',
    password: '#password'
  }
  let url
  let loginBtn
  let playBtn
  let shuffle

  let errorLog = false
  let connected = false

  try {
    url = 'https://app.napster.com/login/'
    loginBtn = '.signin'
    albums = [
      'https://app.napster.com/artist/honey/album/just-another-emotion',
      'https://app.napster.com/artist/yokem/album/boombeats',
      'https://app.napster.com/artist/hanke/album/new-york-story',
      'https://app.napster.com/artist/hanke/album/100-revenge',
      'https://app.napster.com/artist/yonne/album/loser'
    ]
    playBtn = '.track-list-header .shuffle-button'
    shuffle = '.repeat-button.off'

    // if (!persist) {
    // if (restartAccount) {
    connected = await nightmare
      .goto(album())
      .wait(4000 + rand(2000))
      .evaluate(() => {
        return document.querySelector('.track-list-header .shuffle-button')
      })
      .then()
      .catch(async (e) => {
        console.log('catch logged' + e)
        errorLog = e
      })
    // }

    if (errorLog) { throw 'out' }

    if (!connected) {
      await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .wait(2000 + rand(2000))
        .click(loginBtn)
        .then()
        .catch(async (e) => {
          console.log('catch login timeout' + e)
          errorLog = true
        })

      if (errorLog) { throw 'out' }

      await nightmare
        .wait('#player')
        .wait(2000 + rand(2000))
        .then()
        .catch(async (e) => {
          console.log('catch login' + e)
          errorLog = true
        })

      if (errorLog) { throw 'del' }

      await nightmare
        .goto(album())
        .then()
        .catch(async (e) => {
          console.log('catch login timeout' + e)
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
        console.log('catch account type' + e)
        errorLog = true
      })

    if (errorLog) { throw 'out' }

    if (issue) {
      if (restartAccount) {
        console.log('out issue', login)
      }
      throw 'del'
    }
    // }

    await nightmare
      .wait(2000 + rand(2000))
      .click(playBtn)
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
        console.log('catch album' + e)
        errorLog = true
      })

    if (errorLog) { throw 'out' }

    accountsValid = accountsValid.filter(a => a !== account)
    accountsValid.push(account)
    save()


    if (restartAccount && !night) {
      console.log('reco ', login)
    }

    if (accountsValid.length < 30) {
      main()
    }

    if (check) {
      await nightmare.end()
    }
    else {
      let t1
      let t2
      let freeze = 0
      let isChanging = false

      let inter = setInterval(async () => {
        if (over) { return clearInterval(inter) }

        const used = await nightmare
          .evaluate(() => {
            return document.querySelector('.player-error-box') && document.querySelector('.player-error-box').innerHTML
          })

        if (used) {
          clearInterval(inter)
          console.log("ERROR used ", login)
          accountsValid = accountsValid.filter(a => a !== account)
          accounts.push(account)
          await nightmare.end(() => {
            setTimeout(async () => {
              main(null, null, true)
            }, 1000 * 45 * countTimeout++);
          })
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
            console.log('no time bar ', login)
          }

          setTimeout(async () => {
            await nightmare
              .goto(album())
              .wait(2000 + rand(2000))
              .click(playBtn)
              .then()
              .catch(async (e) => {
                clearInterval(inter)
                if (accountsValid.length === 23) {
                  main()
                }
                accountsValid = accountsValid.filter(a => a !== account)
                accounts.push(account)
                await nightmare.end()
                console.log("ERROR freeze ", login)
              })

            countTimeoutFreeze--
            isChanging = false
          }, 1000 * 30 * countTimeoutFreeze++);
        }

        t2 = t1
      }, 1000 * 15)
    }
  }
  catch (e) {
    accountsValid = accountsValid.filter(a => a !== account)
    save()

    if (e !== 'del') {
      accounts.push(account)
    }
    else {
      console.log("ERROR ", login, e)
    }

    await nightmare.end(() => {
      setTimeout(async () => {
        main(null, null, true)
      }, 1000 * 45 * countTimeout++);
    })
  }
}

fs.readFile('napsterAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  // shuffle(data)
  data = data.split(',')
  if (process.env.SLICE) {
    accounts = data.slice(process.env.SLICE)
  }
  else {
    accounts = data.slice(0, 59)
  }
  console.log(accounts.length)
  main()
});

process.on('SIGINT', function (code) {
  over = true
  fs.writeFile('napsterAccount.txt', accountsValid.concat(accounts).join(','), function (err) {
    if (err) return console.log(err);
  });
});
