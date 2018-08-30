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
  if (onecaptcha || processing) { return }
  processing = true;
  request({
    url: 'https://api.anti-captcha.com/createTask',
    method: 'POST',
    json: true,
    data: {
      clientKey: '21648811563096fd1970c47f55b3d548',
      task: {
        type: 'NoCaptchaTaskProxyless',
        websiteKey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
        websiteURL: captchaisNew ? 'https://spotify.com/dk/signup' : 'https://accounts.spotify.com/dk/login',
        invisible: captchaisNew ? 0 : 1
      }
    }
  }, function (err, res, response) {
    // console.log(response)
    if (!response || response.errorId) {
      console.log(response || 'no response')
      processing = false
      onecaptcha = false
      return;
    }

    onecaptcha = true;

    const interval = setInterval(() => {
      request({
        url: 'https://api.anti-captcha.com/getTaskResult',
        method: 'POST',
        json: true,
        data: {
          clientKey: '21648811563096fd1970c47f55b3d548',
          taskId: response.taskId
        }
      }, function (err, res, response) {
        try {
          if (response && response.status !== 'processing') {
            clearInterval(interval)
            onecaptcha = false;
            captcha = response.solution.gRecaptchaResponse
            main()
          }
          else if (!response) {
            clearInterval(interval)
            onecaptcha = false;
            processing = false;
          }
        }
        catch (e) {
          clearInterval(interval)
          onecaptcha = false;
          processing = false;
        }
      });
    }, 10000)
  });
}

const main = async (restart) => {
  let account = accounts.shift()

  if (accountsValid.length < 5) {
    console.log(account)
  }

  fs.writeFile(process.env.FILE, accounts.join(','), function (err) {
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
    waitTimeout: 1000 * 60,
    show: false,
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
  let pause = rand(4) + 2

  const album = () => albums[rand(albums.length)]
  let nAl

  try {
    const error = await nightmare
      .goto(url)
      .wait(4000 + rand(2000))
      .type(inputs.username, login)
      .type(inputs.password, pass)
      .wait(2000)
      .evaluate((captcha) => {
        window.___grecaptcha_cfg.clients[0].aa.l.callback(captcha)
      }, captcha)

    const loop = async () => {
      try {
        let aUrl = album()

        while (aUrl === nAl) {
          aUrl = album()
        }

        nAl = aUrl
        // console.log('change : ' + nAl)
        let like = await nightmare
          .wait(4000 + rand(2000))
          .goto(nAl)
          .wait(4000 + rand(2000))
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
              document.querySelector(like) && document.querySelector(like).click()
            }, 5000);
          })

        if (++change > pause) {
          change = 0
          pause = rand(4) + 2
          // console.log(account, 'change pause')
          return
        }

        await nightmare
          .click(playBtn)
      }
      catch (e) {
        console.log('loop error (' + e.code + ') ' + login)
        loop()
        if (!e.code) {
          console.log('loop error ' + login + ' out')
          clearInterval(inter)
          accountsValid = accountsValid.filter(a => a !== account)
          await nightmare.end()
          processing = false
        }
      }
    }

    loop()

    accountsValid.push(account)
    processing = false

    inter = setInterval(loop, 1000 * 60 * 10 + rand(1000 * 60 * 5));
  }
  catch (e) {
    if (e.code) {
      console.log('error ' + login + ' ' + e.code)
    }
    else {
      console.log(e)
    }
    if (errors.indexOf(e.code) >= 0) {
      accounts.unshift(account)
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
  if (accounts.length && !processing && !onecaptcha && accountsValid.length < 30) {
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
}, 1000 * 30)

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