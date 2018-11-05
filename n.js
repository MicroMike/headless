// setTimeout(() => {
  const ls = spawn('node', ['napster']);

  ls.stdout.on('data', function (data) {
    console.log(data);
  });

  ls.stderr.on('data', function (data) {
    console.log(data);
  });

  ls.on('close', function (code) {
    console.log(`child process exited with code ${code}`);
  });
// }, 1000 * 60 * 60 * 6);