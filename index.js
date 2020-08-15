var exec = require('child_process').exec;

function fish(ip,port,name,password) {
  exec('node fish.js '+ip+ ' '+port+' '+name,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    }
  );
}
fish("181.188.41.95","25565","FishBot1")
fish("181.188.41.95","25565","FishBot2")
fish("181.188.41.95","25565","FishBot3")
fish("181.188.41.95","25565","FishBot4")