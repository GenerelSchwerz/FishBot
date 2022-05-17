var exec = require('child_process').exec;

function fish(ip,port,name,password) {
  if(password) {
   exec('node fish.js '+ip+' '+port+' '+name+' '+password, (error, stdout, stderr) => {console.log(error,stdout,stderr)});
    return; 
  }
 exec('node fish.js '+ip+' '+port+' '+name, (error, stdout, stderr) => {console.log(error,stdout,stderr)});
 return;
}
fish("1.2.3.4","25565","FishBot1")