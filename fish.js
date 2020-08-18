/* Lets */
let mcData;
let nowFishing = false
let autoEjecting = false;
/* Consts */
const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
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
"-restart: Restarts bot",
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
/* Functions - Drop/Auto-eject */
function eject(i) {
  if (!bot.inventory.items()[i]) {

    setTimeout(function() {bot.look(0,0,false,function() {});},100);
    return // if we dropped all items, stop.
  }
  if (bot.inventory.items()[i].type == mcData.itemsByName.fishing_rod.id) {
    eject(i+1)
    return;
  }
  bot.tossStack(bot.inventory.items()[i], () => eject(i + 1))
}
function dropAll() {
  let x = bot.entity.position.x
  let y = bot.entity.position.y
  let z = bot.entity.position.z
  bot.findBlock({
    point: bot.entity.position,
    matching: mcData.blocksByName.hopper.id,
    maxDistance: 10,
    count: 1,
  }, function(err, blocks) {
    if (err) {
      bot.chat('Error trying to find a hopper! ' + err);
    }
    if (blocks.length) {
      const defaultMove = new Movements(bot, mcData)
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalNear(blocks[0].position.x, blocks[0].position.y, blocks[0].position.z, 1))
      bot.once('goal_reached', function() {
        bot.look(0,-90,true,eject);
      })
      setTimeout(function() {
        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalNear(x,y,z, 1))
      },10000)
    } else {
      bot.chat("Couldn't find a hopper.");
    }
  });
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
    if(bot.inventory.items().length >= 25) dropAll();
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
      if (err.message == "Invalid item object in equip") return bot.chat("No fishing rods.")
      return bot.chat(err.message)
    }

    nowFishing = true
    bot.on('playerCollect', FishCollect)

    bot.fish((err) => {
      nowFishing = false

      if (err) {
        if(err.message == "Fishing cancelled") return;
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


bot.loadPlugin(pathfinder)
bot.loadPlugin(blockFinderPlugin);

bot.on('login', () => {
  bot.chat("loading...")
  mcData = require('minecraft-data')(bot.version)
})

bot.on('spawn', () => {
   //mc donalds
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
  if(message.startsWith("-moveto")) {
    let coordinates = message.split('-moveto ')[1]
    if(!coordinates) return;
    let x = parseInt(coordinates.split(' ')[0],10);
    let y = parseInt(coordinates.split(' ')[1],10);
    let z = parseInt(coordinates.split(' ')[2],10);
    if(z == undefined || z == NaN) return;
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)
    bot.pathfinder.setGoal(new GoalNear(x,y,z, 1))
    return;
  }
  switch(message) {
    case "-h":
    case "-help":
      for(let i = 0;i < help.length;i++) {
        setTimeout(function (){
          bot.chat(help[i])
        },i*50);
      }
      break;

    case "-f":
    case "-fish":
      startFishing();
      break;

    case "-s":
    case "-stop":
      if(nowFishing) {
        stopFishing();
        bot.chat("Stopped fishing.")
      } 
      bot.pathfinder.setGoal(null)
      break;

    case "-e":
    case "-eject":
      s = 0;
      dropAll(0);
      break;
    
    case "-restart":
      restart();
      break;

    case "-a":
    case "-autoeject":
      autoEject();
      break;

    case "-c":
    case "-cum":
    case "-come":
      const defaultMove = new Movements(bot, mcData)
      const target = bot.players[user].entity
      if(!target) { bot.chat("Couldn't find you."); return }
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 1))
      break;
    default:
      break;
  }
})

rl.on('line', (input) => {
  bot.chat(input)
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