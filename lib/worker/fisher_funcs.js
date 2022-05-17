"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulFishing = exports.getChestDeposit = exports.getFishingSpot = exports.getBestRod = exports.dropAllOfItemInHopper = exports.placeAllOfItemInChest = exports.dropAllOfItem = exports.dropItems = exports.setupBot = void 0;
const mineflayer_1 = require("mineflayer");
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const vec3_1 = require("vec3");
function setupBot(data, fishingConfig) {
    let bot = (0, mineflayer_1.createBot)(data);
    bot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
    // if (fishingConfig.fishing) {
    //     bot.on("playerCollect", (player: Entity, entity: Entity) => {
    //         if (entity.kind === 'Drops' && player === bot.entity) {
    //             /* this means we got an item
    //              * let's drop everything in our inventory! */
    //             if (bot.inventory.items().length >= 25) dropItems(bot);
    //         }
    //     })
    // }
    bot.once("spawn", () => {
        process.send({ subject: "botSpawned" });
    });
    return bot;
}
exports.setupBot = setupBot;
async function dropItems(bot) {
    await dropAllOfItem(bot, "fish");
    await dropAllOfItem(bot, "book");
    await dropAllOfItem(bot, "fishing_rod");
}
exports.dropItems = dropItems;
async function dropAllOfItem(bot, name) {
    let item;
    while (true) {
        item = bot.inventory.items().find(item => item.name === name);
        if (!item)
            break;
        await bot.tossStack(item);
    }
}
exports.dropAllOfItem = dropAllOfItem;
async function placeAllOfItemInChest(bot, chestBlock, name) {
    if (chestBlock instanceof vec3_1.Vec3)
        chestBlock = bot.blockAt(chestBlock);
    let chest = await bot.openContainer(chestBlock);
    let item;
    while (true) {
        item = bot.inventory.items().find(item => item.name === name);
        if (!item)
            break;
        await chest.deposit(item.type, null, null);
    }
    await chest.close();
}
exports.placeAllOfItemInChest = placeAllOfItemInChest;
async function dropAllOfItemInHopper(bot, hopperBlockPos, name) {
    await bot.pathfinder.goto(new mineflayer_pathfinder_1.goals.GoalLookAtBlock(hopperBlockPos, bot.world));
    await dropAllOfItem(bot, name);
}
exports.dropAllOfItemInHopper = dropAllOfItemInHopper;
const enchantmentWeights = {
    lure: 1,
    mending: 3,
    unbreaking: 0.01,
    luck_of_the_sea: 1
};
function getBestRod(bot) {
    let items = bot.inventory.items().filter(item => item.name === "fishing_rod");
    if (items.length === 0)
        return null;
    let itemRanks = items.map(item => {
        let weight = 0;
        for (let enchantment of item.enchants) {
            if (enchantment.name in enchantmentWeights) {
                weight += enchantmentWeights[enchantment.name] * enchantment.lvl;
            }
            else {
                console.log("Unknown enchantment: " + enchantment.name);
            }
        }
        return weight;
    });
    let highest = Math.max(...itemRanks);
    return items[itemRanks.indexOf(highest)];
}
exports.getBestRod = getBestRod;
function getFishingSpot(bot, waterId) {
    let blocks = bot.findBlocks({
        point: bot.entity.position.offset(0, bot.entity.height, 0),
        matching: waterId,
        maxDistance: 8,
        count: 50
    });
    let block = blocks[0];
    return block;
}
exports.getFishingSpot = getFishingSpot;
function getChestDeposit(bot, chestId, wantedItemId) {
    let blocks = bot.findBlocks({
        point: bot.entity.position.offset(0, bot.entity.height, 0),
        matching: chestId,
        maxDistance: 32,
        count: 50
    });
    let block = blocks[0];
    return block;
}
exports.getChestDeposit = getChestDeposit;
async function gracefulFishing(bot, waterId, chestId) {
    let spot = getFishingSpot(bot, waterId);
    let rod;
    while (!!(rod = getBestRod(bot))) {
        console.log("doing");
        let items = bot.inventory.items().filter(item => !!item);
        if (bot.inventory.items().length - items.length === 0) {
            let current = bot.entity.position;
            let chest = getChestDeposit(bot, chestId);
            await bot.pathfinder.goto(new mineflayer_pathfinder_1.goals.GoalLookAtBlock(chest, bot.world));
            for (const item of items) {
                await placeAllOfItemInChest(bot, chest, item.name);
            }
            await bot.pathfinder.goto(new mineflayer_pathfinder_1.goals.GoalBlock(current.x, current.y, current.z));
        }
        else {
            await bot.equip(rod, "hand");
            await bot.lookAt(spot);
            await bot.fish();
        }
    }
    console.log("done");
}
exports.gracefulFishing = gracefulFishing;
// export function fishOnce(bot: Bot): Promise<Vec3> {
//     return new Promise((res, rej) => {
//         const listener = (soundName: string, position: Vec3, volume: number, pitch: number) => {
//             if (soundName == 'entity.bobber.splash') res(position);
//         }
//         setTimeout(() => {
//             bot.off("soundEffectHeard", listener);
//             rej(new Error("Failed to fish in time"));
//         }, 30000);
//         bot.on('soundEffectHeard', listener);
//     })
// }
