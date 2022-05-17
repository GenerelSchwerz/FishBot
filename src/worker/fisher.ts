import { Bot, BotOptions, Chest, createBot, Player } from "mineflayer";
import md, { IndexedData } from "minecraft-data";
import prismarineRegistry from "prismarine-registry";
import * as funcs from "./fisher_funcs";
import { FishingOptions, htwMessage, wthMessage } from "./types"
import { once } from "events";
import { Vec3 } from "vec3";
import { goals } from "mineflayer-pathfinder";


let bot: Bot | undefined;
let botConfig: BotOptions;
let fishingConfig: FishingOptions = {
    fishing: false,
    autoEjecting: false,
    rods: 0,
}

let mcData: IndexedData;

process.on("message", async (message) => {
    const msg = message as htwMessage;
    if (!["init", "startBot"].includes(msg.subject) && !bot) return;
    bot = bot!; // lazy type coercion.

    switch (msg.subject) {
        case "init":
            botConfig = msg.data as BotOptions;
            mcData = prismarineRegistry(botConfig.version!);
            break;
        case "startBot":
            if (bot) bot.quit();
            bot = funcs.setupBot(botConfig, fishingConfig, mcData);
            break;
        case "stopBot":
            bot.quit();
            bot = undefined;
            fishingConfig.fishing = false;
            break;
        case "startFish":
            if (fishingConfig.fishing) return;
            // if (!bot) {
            //     console.log("no bot")
            //     bot = funcs.setupBot(botConfig, fishingConfig, mcData);
            //     while (!bot.entity) await bot.waitForTicks(1);
            // }
            fishingConfig.fishing = true;
            await funcs.gracefulFishing(bot, fishingConfig, mcData.blocksByName.water.id, mcData.blocksByName.chest.id, mcData.itemsByName.fishing_rod.id);
            break;
        case "stopFish":
            if (!fishingConfig.fishing) return;
            fishingConfig.fishing = false;
            bot.customFisher.cancelFishGracefully();
            await funcs.gracefulItemDeposit(bot, mcData.blocksByName.chest.id, bot.inventory.items().filter(item => item.name !== "fishing_rod"));
            break;
        case "resupply":
            await funcs.gracefulAcquireItemsFromChests(bot, mcData.blocksByName.chest.id, [{itemId: mcData.itemsByName.fishing_rod.id, count: 1}]);
            break;
        case "dumpAllItems":
            await funcs.dropAllButItem(bot, "fishing_rod");
            break;
        case "findNewSpot":
            break;
        case "goto":
            if (fishingConfig.fishing) {
                fishingConfig.fishing = false;
                bot.customFisher.cancelFishGracefully();
            }
            const {x, y, z} = msg.data as Vec3;
            bot.pathfinder.setGoal(new goals.GoalGetToBlock(x, y, z));
            await once(bot, "goal_reached");
            break;
        default:
            console.log("Unknown message: ", msg);
            break; //unneeded
        
    }

    console.log(bot?.username, ":", msg.subject, "completed.");
});
