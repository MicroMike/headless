const fs = require('fs');
var request = require('ajax-request');

let accounts = []
let accountsValid = []
let processing = false;
let onecaptcha = false;
let total
let errors = []
let albums = []

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

let captcha = ''
const anticaptcha = (captchaisNew) => {
  // if (onecaptcha || processing) { return }
  processing = true;
  request({
    url: 'https://api.solverecaptcha.com/',
    method: 'POST',
    json: true,
    data: {
      user_id: 828,
      clientKey: 'b1af193c-5b8d1484b09714.95530866',
      sitekey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
      pageurl: captchaisNew ? 'https://spotify.com/dk/signup' : 'https://accounts.spotify.com/dk/login',
    }
  }, function (err, res, response) {
    response = response.split('|')
    const status = response[0]

    if (status === 'OK') {
      captcha = response[1]
      main()
    }
  })
}

const main = async (restart) => {
  let account = accounts.shift()

  if (accountsValid.length < 5) {
    console.log(account)
  }

  fs.writeFile(process.env.FILE, accounts.concat(accountsValid).join(','), function (err) {
    if (err) return console.log(err);
  });

  let inter
  const Nightmare = require('nightmare')
  const nightmare = Nightmare({
    electronPath: require('electron'),
    // openDevTools: {
    //   mode: 'detach'
    // },
    alwaysOnTop: false,
    waitTimeout: 1000 * 30,
    show: false,
    width: 300,
    height: 300,
    typeInterval: 300,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      experimentalFeatures: true
    }
  })

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

  url = 'https://accounts.spotify.com/dk/login'
  loginBtn = '#login-button'
  playBtn = '.tracklist-play-pause.tracklist-middle-align'
  inputs.username = 'form input[name="username"]'
  inputs.password = 'form input[name="password"]'

  let change = 0
  let pause = rand(2) + 2

  const album = () => albums[rand(albums.length)]
  let nAl

  try {
    const error = await nightmare
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

    const loop = async () => {
      try {
        let aUrl = album()

        while (aUrl === nAl) {
          aUrl = album()
        }

        nAl = aUrl

        if (++change > pause) {
          change = 0
          pause = rand(2) + 2
          // console.log(account, 'change pause')
          return
        }

        // console.log('change : ' + nAl)
        let like = await nightmare
          .wait(2000 + rand(2000))
          .goto(nAl)
          .wait(2000 + rand(2000))
          .wait('.nowPlayingBar-container')
          .evaluate(() => {
            let playBtn = '.tracklist-play-pause.tracklist-middle-align'
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
          })
      }
      catch (e) {
        if (!e.code) {
          console.log('loop error ' + login + ' out ' + e)
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          await nightmare.end()
          processing = false
        }
        else {
          console.log('loop error (' + e.code + ') ' + login)
          setTimeout(() => {
            loop()
          }, 1000 * 30);
        }
      }
    }

    loop()

    accountsValid.push(account)
    processing = false

    inter = setInterval(loop, 1000 * 60 * 30 + rand(1000 * 60 * 10));
  }
  catch (e) {
    if (e.code) {
      if (e.code === -1) {
        console.log(e)
      }
      else {
        console.log('error ' + login + ' ' + e.code)
      }
      if (errors.indexOf(e.code) >= 0) {
        accounts.unshift(account)
      }
    }
    else {
      console.log(login + ' error login')
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

setInterval(() => {
  if (accounts.length - 1) {
    anticaptcha()
  }

  // fs.readFile(process.env.FILE, 'utf8', function (err, data) {
  //   if (err) return console.log(err);
  //   let tempaccounts = data.split(',')
  //   accounts = tempaccounts.filter(account => accountsValid.indexOf(account) === -1)
  //   if (accountsValid.length < 5) {
  //     console.log(accounts.length)
  //   }
  // });

  fs.readFile('errors.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    errors = data.split(',')
  });
}, 1000 * 30 + rand(1000 * 30))

setInterval(() => {
  console.log('total ' + accountsValid.length + '/' + accounts.length + ' left')
}, 1000 * 60 * 5);

setInterval(() => {
  fs.readFile('albums.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    albums = data.split(',')
    console.log('albums ' + albums.length)
  });
}, 1000 * 60 * 60);