let one = []
let two = []
let valid = []

const fs = require('fs');

fs.readFile('spotifyAccount.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  one = data.split(',')
});

fs.readFile('compare.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);
  two = data.split(',')
});

setTimeout(() => {
  while (one.length) {
    let account = one.shift()
    if (one.indexOf(account) >= 0) {
      console.log(account)
      fs.writeFile('compare.txt', valid.concat(one), function (err) {
        if (err) return console.log(err);
      });
    }
    else {
      valid.push(account)
    }
  }
}, 5000);