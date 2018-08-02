let one = []
let two = []
let valid = []

const fs = require('fs');

fs.readFile('spotifyAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  one = data.split(',')
});

setTimeout(async () => {
  while (one.length) {
    let account = one.shift()
    if (one.indexOf(account) >= 0) {
      console.log(account)
    }
    else {
      valid.push(account)
    }
  }
  fs.writeFile('spotifyAccount.txt', valid, function (err) {
    if (err) return console.log(err);
  });
}, 5000);