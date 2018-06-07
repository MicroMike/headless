var fs = require('fs');
var request = require('ajax-request');

var emails
var playing = []
var count = 0
var blacklist = []

const englobe = async (captchaFCT) => {
  var isRunning = false

  const getRandomInt = (max, min) => {
    return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 1));
  }

  fs.readFile('emails.txt', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    emails = data.split(',')

    run()

    setInterval(() => {
      if (!isRunning) {
        run()
      }
    }, 1000 * 60 * 1)
  });

  const run = async () => {
    const Nightmare = require('nightmare')
    // require('nightmare-iframe-manager')(Nightmare);
    const nightmare = Nightmare({
      electronPath: require('electron'),
      // openDevTools: {
      //   mode: 'detach'
      // },
      waitTimeout: 60000,
      alwaysOnTop: false,
      show: true,
      typeInterval: 300,
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
        plugins: true,
        experimentalFeatures: true
      }
    })
    // var iframe = require('nightmare-iframe');

    var artists = [
      'artist/4fjzml1NOgcHdsmJM00i7a',
      'artist/5WuAJTOU9cvpenk1t5CyJM',
      'artist/5c8MuSvGUcVLTRmjMmg3OO',
      'album/0hf0fEpwluYYWwV1OoCWGX',
      'album/5ceAg32Kt8ta6U7qWYPesW',
      'album/3FJdPTLyJVPYMqQQUyb6lr',
      'album/6vvfbzMU2dkFQRJiP99RS4',
    ]

    var currentmail

    var oneHour = 3600000;
    var interval = getRandomInt(720000, 480000)
    var intervalHours = getRandomInt(oneHour * 3, oneHour * 1.5)

    const tempmaillist = [
      'https://www.tempmailaddress.com',
      'https://www.tempmailaddress.com',
      // 'https://www.mohmal.com/fr/create/random',
      // 'https://www.crazymailing.com',
    ]

    var emailurl = tempmaillist[getRandomInt(tempmaillist.length, 0)]

    var url = (newA) => (newA ? 'https://spotify.com/fr/signup' : 'https://accounts.spotify.com/fr/login');

    const yn70 = () => (getRandomInt(10, 1) > 7 ? true : false)

    const restart = (halt) => {
      isRunning = false
      nightmare
        .halt('Halt', () => {
          var indexPlaying = playing.indexOf(currentmail)
          if (indexPlaying > -1) {
            playing.splice(indexPlaying, 1)

            if (halt) {
              console.log('Halt')
              emails.push(currentmail)
            }
          }

          if (!halt) {
            console.log('Error restart')
            blacklist.push(currentmail)

            var concat = emails.concat(playing)
            fs.writeFile('emails.txt', concat.join(','), function (err) {
              if (err) {
                return console.log(err);
              }
            });

            fs.appendFile('blackmail.txt', blacklist.join(',') + ',', function (err) {
              if (err) {
                return console.log(err);
              }
            });
          }
        })
    }

    var month = getRandomInt(12)
    month = month < 10 ? '0' + month : '' + month

    const doItAgain = async (first) => {
      try {
        await nightmare
          .wait(5000)
          .goto('https://open.spotify.com/' + artists[getRandomInt(artists.length, 0)])
          .forward()
          .wait('.tracklist-play-pause.tracklist-middle-align')
          .click('.tracklist-play-pause.tracklist-middle-align')

        if (first) {
          await nightmare
            .wait(5000)
            .click('.control-button.spoticon-shuffle-16')

          playing.push(currentmail)

          await console.log('\x1b[34m%s\x1b[0m', 'start :' + currentmail + ' ' + playing.length)

          isRunning = false
        }
      }
      catch (e) {
        console.log('\x1b[31m%s\x1b[0m', e + ' : ' + currentmail)
        if (e.match(/navigation/)) {
          doItAgain()
        }
        else {
          restart()
        }
      }
    }

    const create = async (newAccount, captcha) => {
      try {
        await nightmare
          .goto(url(newAccount))
          .forward()

        if (newAccount) {
          await nightmare
            .evaluate((captcha) => {
              document.getElementById('g-recaptcha-response').value = captcha
            }, captcha)

          nightmare
            .type('form input[name="email"]', currentmail)
            .type('form input[name="confirm_email"]', currentmail)
            .type('form input[name="password"]', currentmail)
            .type('form input[name="displayname"]', currentmail.split('@')[0])
            .type('form input[name="dob_day"]', getRandomInt(28))
            .select('form select[name="dob_month"]', month)
            .type('form input[name="dob_year"]', getRandomInt(32, 1963))
            .click('form input[id="register-' + (yn70() ? 'male' : 'female') + '"]')
            .wait(10000)
            .click('#register-button-email-submit')
        }
        else {
          await nightmare
            .type('form input[name="username"]', currentmail)
            .type('form input[name="password"]', currentmail)
            .wait(1000)
            .evaluate((captcha) => {
              window.___grecaptcha_cfg.clients[0].aa.l.callback(captcha)
            }, captcha)
        }

        await console.log('\x1b[32m%s\x1b[0m', (newAccount ? 'account created: ' : 'account logged: ') + currentmail)

        if (newAccount) {
          await nightmare
            .wait('.welcome-message')
            .click('.welcome-message')
            .goto(emailurl)
            .forward()

          if (emailurl === 'https://www.mohmal.com/fr/create/random') {
            var urlclick = await nightmare
              .wait(5000)
              .evaluate(() => {
                var id = $('[data-msg-id]').attr('data-msg-id')
                return 'https://www.mohmal.com/fr/message/' + id
              })

            var urlactivate = await nightmare
              .goto(urlclick)
              .forward()
              .wait('.call-to-action-button')
              .evaluate(() => {
                return document.getElementsByClassName('call-to-action-button')[0].href;
              })
          }
          if (emailurl === 'https://www.tempmailaddress.com') {
            var urlactivate = await nightmare
              .wait('#schranka tr.hidden-md[data-href="2"]')
              .goto('https://www.tempmailaddress.com/email/id/2')
              .forward()
              .goto('https://www.tempmailaddress.com/email/id/2')
              .forward()
              .wait('.call-to-action-button')
              .evaluate(() => {
                return document.getElementsByClassName('call-to-action-button')[0].href;
              })
          }

          await nightmare
            .goto(urlactivate)
            .forward()
            .wait(5000)

          fs.appendFile('emails.txt', ',' + currentmail, function (err) {
            if (err) {
              return console.log(err);
            }
          });

          console.log('The email: ' + currentmail + ' was saved!');
        }

        await doItAgain(true)

        var doitinter = setInterval(() => {
          doItAgain(false)
        }, interval + getRandomInt(1000 * 60 * 2));

        setTimeout(() => {
          clearInterval(doitinter)
          restart(true)
        }, 1000 * 60 * 60 * 5 + getRandomInt(1000 * 60 * 60 * 1));

      }
      catch (e) {
        console.log('\x1b[31m%s\x1b[0m', e + ' ' + currentmail)
        restart()
      }

      // .goto('https://open.spotify.com/album/0hf0fEpwluYYWwV1OoCWGX')
      // // .wait('.tracklist-header__extra-buttons .btn.btn-transparent')
      // .click('.tracklist-header__extra-buttons .btn.btn-transparent')
      // .goto('https://open.spotify.com/collection/tracks')
      // .click('.tracklist-top-align')

      nightmare
        .catch(error => {
          console.error('\x1b[31m%s\x1b[0m', error, tempmail)
          restart()
        })

    }

    const twocaptcha = (captchaisNew) => {
      request.post({
        url: 'http://2captcha.com/in.php',
        data: {
          key: '964a5072a7fdea86b877739dc4ea4788',
          method: 'userrecaptcha',
          googlekey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
          pageurl: captchaisNew ? 'https://spotify.com/fr/signup' : 'https://accounts.spotify.com/fr/login',
          invisible: captchaisNew ? 0 : 1
        }
      }, function (err, res, body) {
        console.log(body)

        const interval = setInterval(() => {
          request({
            url: 'http://2captcha.com/res.php',
            method: 'GET',
            data: {
              key: '964a5072a7fdea86b877739dc4ea4788',
              action: 'get',
              id: body.split('|')[1]
            }
          }, function (err, res, body) {
            if (body !== 'CAPCHA_NOT_READY') {
              clearInterval(interval)
              if (body) {
                create(captchaisNew, body.split('|')[1])
              }
              else {
                twocaptcha(captchaisNew)
              }
            }
            else {
              // console.log(body.split('|')[0])
            }
          });
        }, 10000)
      })
    }

    const anticaptcha = (captchaisNew) => {
      request({
        url: 'https://api.anti-captcha.com/createTask',
        method: 'POST',
        json: true,
        data: {
          clientKey: '5cf44dee27fed739df49a69bb4494b9a',
          task: {
            type: 'NoCaptchaTaskProxyless',
            websiteKey: captchaisNew ? '6LdaGwcTAAAAAJfb0xQdr3FqU4ZzfAc_QZvIPby5' : '6LeIZkQUAAAAANoHuYD1qz5bV_ANGCJ7n7OAW3mo',
            websiteURL: captchaisNew ? 'https://spotify.com/fr/signup' : 'https://accounts.spotify.com/fr/login',
            invisible: captchaisNew ? 0 : 1
          }
        }
      }, function (err, res, response) {
        console.log(response)

        const interval = setInterval(() => {
          request({
            url: 'https://api.anti-captcha.com/getTaskResult',
            method: 'POST',
            json: true,
            data: {
              clientKey: '5cf44dee27fed739df49a69bb4494b9a',
              taskId: response.taskId
            }
          }, function (err, res, response) {
            if (response.status !== 'processing') {
              clearInterval(interval)
              create(captchaisNew, response.solution.gRecaptchaResponse)
            }
            else {
              // console.log(response)
            }
          });
        }, 10000)
      });
    }

    try {
      var isNew = ++count % 20 === 0
      const randemail = getRandomInt(emails.length, 0)

      isNew = !isNew && emails.length === 0 ? true : isNew;

      if (playing.length > 150 || isRunning) {
        return
      }

      isRunning = true

      const tempmail = isNew
        ? await nightmare
          .goto(emailurl)
          .wait(2000)
          .evaluate((emailurl) => {
            switch (emailurl) {
              case 'https://www.mohmal.com/fr/create/random':
                return $('[data-email]').attr('data-email')
              case 'https://www.crazymailing.com':
                return document.getElementById('email_addr').innerText
              case 'https://www.tempmailaddress.com':
                return document.getElementById('email').innerText
            }
          }, emailurl)
        : emails[randemail]

      emails.splice(randemail, 1)
      currentmail = tempmail

      // if (emails.length === 0) {
      //   clearInterval(inter)
      // }

      // setTimeout(() => {
      captchaFCT ? anticaptcha(isNew) : twocaptcha(isNew);
      // twocaptcha(isNew);
      // create(true)
      // }, getRandomInt(1000 * 60 * 1));
    }
    catch (e) {
      console.log(e)
      restart()
    }
  }
}

// englobe(true)
englobe(false)