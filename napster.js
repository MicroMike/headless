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
let finish = false
const max = 20

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
    gotoTimeout: 1000 * 59,
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
  let suppressed = false

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
      suppressed = await nightmare
        .goto(url)
        .wait(2000 + rand(2000))
        .type(inputs.username, login)
        .type(inputs.password, pass)
        .wait(2000 + rand(2000))
        .click(loginBtn)
        .forward()
        .wait('.nav-profile-button')
        .then()
        .catch(async (e) => {
          console.log('catch login timeout' + e)
          return await nightmare
            .evaluate(() => {
              return document.querySelector('.login-error')
            })
          errorLog = true
        })

      if (suppressed) { throw 'del' }
      if (errorLog) {
        await nightmare.end(() => {
          setTimeout(async () => {
            main(account, null, true)
          }, 1000 * 45 * countTimeout++);
        })
        return
      }

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
      let totalFreeze = 0
      let isChanging = false
      let time = 0

      let inter = setInterval(async () => {
        if (over) { return clearInterval(inter) }

        time += 1000 * 15

        if (time > 1000 * 60 * 10 + rand(1000 * 60 * 10)) {
          clearInterval(inter)
          await nightmare.end(() => {
            setTimeout(async () => {
              main(null, null, true)
            }, 1000 * 45 * countTimeout++);
          })
          return
        }

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
            clearInterval(inter)
            console.log('no time bar ', login)
            accountsValid = accountsValid.filter(a => a !== account)
            accounts.push(account)
            await nightmare.end()
            return
          }

          const ifCatch = async (e) => {
            clearInterval(inter)
            accountsValid = accountsValid.filter(a => a !== account)
            accounts.push(account)
            if (finish) {
              main(null, null, true)
            }
            await nightmare.end()
            console.log("ERROR freeze ", login)
          }

          const tryChange = async () => {
            totalFreeze = 0
            await nightmare
              .goto(album())
              .wait(2000 + rand(2000))
              .click(playBtn)
              .then()
              .catch(ifCatch)
          }

          if (totalFreeze++ < 3) {
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
            }, 1000 * 45 * countTimeout++);
          }
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
    accounts = data.slice(0, 44)
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
