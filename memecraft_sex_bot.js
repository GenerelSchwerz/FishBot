/* shit */
const mineflayer = require('mineflayer');
if (process.argv.length < 4 || process.argv.length > 5) {
  console.log('node memecraft_sex_bot.js <host> <port>')
  process.exit(1)
}

function shit1() {
  var bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: "sexbot",
  });

  bot.on('spawn',function (){
    setInterval(function() {
      bot.setControlState('sneak', true)
    },10)
    setInterval(function() {
      bot.setControlState('sneak', false)
    },20)
    setInterval(function() {
      bot.chat("cum inside meeeee") //lmao lmaooo
    },2000)
  })
  bot.on('end',function() {shit1()});
}

function shit2() {
  var bot2 = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: "saxbot",
  });

  bot2.on('spawn',function (){
    setInterval(function() {
      bot2.setControlState('sneak', true)
    },10)
    setInterval(function() {
      bot2.setControlState('sneak', false)
    },20)
    setInterval(function() {
      bot2.chat("Your ass is tight <3") //lmao lmaooo
    },2000)
  })
  bot2.on('end',function() {shit2()})
}
shit1();
shit2();