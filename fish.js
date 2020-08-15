/* Lets */
let mcData;
let nowFishing = false
let autoEjecting = false;
/* Consts */
const mineflayer = require('mineflayer');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const fs = require('fs');
const readline = require("readline")
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const help = [
"-----------------------------",
"Help:",
"-fish: Starts autofishing.",
"-stop: Stops autofishing/pathfinding.",
"-eject: Drops all items.",
"-autoeject: Automatically ejects items.",
"-restart: restart bot",
"-----------------------------"]

/* Arguments (needs to be above the create bot function) */
if (process.argv.length < 4 || process.argv.length > 5) {
  console.log('node fish.js <host> <port> <name> [<password>]')
  process.exit(1)
}

/* Vars */
var bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4],
  password: process.argv[5]
});
var s = 0;

/* Functions - Drop/Auto-eject */
function dropAll() {
  if (bot.inventory.items().length === 0 || bot.inventory.items().every(elem => elem == mcData.itemsByName.fishing_rod)) return
  
  const item = bot.inventory.items()[0+s]
  if(!item) return;
  if(item.id != mcData.itemsByName.fishing_rod.id) {
    bot.tossStack(item,dropAll)
  } else {
    s++;
    dropAll()
  }
}

function autoEject() {
  autoEjecting = !autoEjecting;
  switch(autoEjecting) {
    case false:
      bot.removeListener('playerCollect', autoEjectOnCollect)
      break;
    case true:
      bot.on('playerCollect', autoEjectOnCollect)
      break;
  }
}
function autoEjectOnCollect(player, entity) {
  if (entity.kind === 'Drops' && player === bot.entity) {
    /* this means we got an item
     * let's drop everything in our inventory! */
    s = 0;
    dropAll();
  }
}
/* Functions - Fish */
function FishCollect(player,entity) {
  if (entity.kind === 'Drops' && player === bot.entity) {
    bot.removeListener('playerCollect', FishCollect)
    startFishing()
  }
}
function startFishing () {
  bot.equip(mcData.itemsByName.fishing_rod.id, 'hand', (err) => {
    if (err) {
      return bot.chat(err.message)
    }

    nowFishing = true
    bot.on('playerCollect', FishCollect)

    bot.fish((err) => {
      nowFishing = false

      if (err) {
        bot.chat(err.message)
      }
    })
  })
}
function stopFishing () {
  bot.removeListener('playerCollect', FishCollect)

  if (nowFishing) {
    bot.activateItem()
  }
  
}
/* Functions - console commands */



/* Functions - others */
function restart() {
  /* side note: repl.it doesn't like this at all... */
  setTimeout(function () {
    process.on("exit", function () {
        require("child_process").spawn(process.argv.shift(), process.argv, {
            cwd: process.cwd(),
            detached: false,
            stdio: "inherit"
        });
    });
    process.exit();
  }, 5000);
}


navigatePlugin(bot);

bot.on('login', () => {
  bot.chat("loading...")
  mcData = require('minecraft-data')("1.16.1")
})

bot.on('spawn', () => {
  //mineflayerViewer(bot, { port: 3000 })
  setTimeout(function() {
  bot.chat("FishBot for MC " + bot.version + " started. Do -help for help.")
  },1000)
})
bot.on('message', (cm) => {
  console.log(cm.toString())
  user = cm.toString().split("<")[1]
  if(user == undefined) return;
  message = user.split("> ")[1]
  user = user.split(">")[0]
  switch(message) {
    case "-help":
      for(let i = 0;i < help.length;i++) {
        setTimeout(function (){
          bot.chat(help[i])
        },i*50);
      }
      break;
    case "-fish":
      startFishing();
      break;
    case "-stop":
      if(nowFishing) {
        stopFishing();
        bot.chat("Stopped fishing.")
      }
      bot.navigate.stop();
      break;
    case "-eject":
      s = 0;
      dropAll(0);
      break;
    case "-restart":
      restart();
      break;
    case "-autoeject":
      autoEject();
      break;
    case "-come":
      const target = bot.players[user].entity;
      if(!target) bot.chat("Couldn't find you.")
      bot.navigate.to(target.position);
      break;
    default:
      break;
  }
})

rl.on('line', (input) => {
  bot.chat(input)
});

bot.navigate.on('arrived', function () {
  bot.chat("I'm here!");
});
bot.navigate.on('cannotFind', function (closestPath) {
  bot.chat("Coudldn't go to you. Getting as close as possible.");
  bot.navigate.walk(closestPath);
});


bot.on('error', (err) => {
  fs.writeFile('crash.log', err, function (error) {
    if (error) console.log("Error writing to crash.log");
  });
  restart();
})
bot.on('end', (res) => {
  fs.writeFile('crash.log', res, function (error) {
    if (error) console.log("Error writing to crash.log");
  });
  restart();
})