import { Bot, BotOptions, Chest, createBot, Player } from "mineflayer";
import { goals, Movements, pathfinder } from "mineflayer-pathfinder"
import { Item } from "prismarine-item";
import { Block } from "prismarine-block";
import { Entity } from "prismarine-entity";
import { IndexedData } from "minecraft-data";
import { FishingOptions, wthMessage, htwMessage } from "./types";
import { Vec3 } from "vec3";
import { promisify } from "util";
import md, { Item as mdItem } from "minecraft-data";
import v8 from "v8";
import { once } from "events";

import { inject } from "./dep/better_fishing";

const structuredClone = (obj: any) => {
    return v8.deserialize(v8.serialize(obj));
};

const sleep = promisify(setTimeout);

export function setupBot(data: BotOptions, fishingConfig: FishingOptions, mcdData: IndexedData): Bot {
    let bot = createBot(data);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(inject);
    let moves = new Movements(bot, mcdData);
    moves.canDig = false;
    moves.allowFreeMotion = true;
    bot.pathfinder.setMovements(moves);
    bot.pathfinder.thinkTimeout = 10000;
    bot.on("error", console.log);
    bot.on("end", console.log);
    bot._client.on("end", console.log);
    bot._client.on("error", console.log);

    return bot;
}

export async function dropItems(bot: Bot) {
    await dropAllOfItem(bot, "fish");
    await dropAllOfItem(bot, "book");
    await dropAllOfItem(bot, "fishing_rod");


}

export async function dropAllOfItem(bot: Bot, name: string) {
    let item: Item | undefined;
    while (true) {
        item = bot.inventory.slots.find(item => item.name === name);
        if (!item) break;
        await bot.tossStack(item);
    }
}

export async function dropAllButItem(bot: Bot, name: string) {
    let item: Item | undefined;
    while (true) {
        item = bot.inventory.items().find(item => item.name !== name);
        console.log(item, bot.inventory);
        if (!item) break;
        await bot.tossStack(item);
    }
}


export async function placeItemStackInChest(bot: Bot, chest: Chest, name: string) {
    let item: Item | undefined;
    item = bot.inventory.slots.find(item => item?.name === name);
    if (item) {
        await chest.deposit(item.type, null, Math.min(64, bot.inventory.count(item.type, item.metadata)));
        // let count = bot.inventory.count(item.type, item.metadata);
        // do {
        //     let num = Math.min(64, count);
        //     await chest.deposit(item.type, null, num);
        //     count -= num;
        //     await sleep(50);
        //     console.log("doing", count)
        // } while (count > 0);
    }


}

export async function dropAllOfItemInHopper(bot: Bot, hopperBlockPos: Vec3, name: string) {
    await bot.pathfinder.goto(new goals.GoalLookAtBlock(hopperBlockPos, bot.world));
    await dropAllOfItem(bot, name);
}


const enchantmentWeights: { [name: string]: number } = {
    lure: 1,
    mending: 3,
    unbreaking: 0.01,
    luck_of_the_sea: 1
}
export function getBestRod(bot: Bot) {
    let items = bot.inventory.slots.filter(item => item?.name === "fishing_rod");
    if (items.length === 0) return null;

    let itemRanks: number[] = items.map(item => {
        let weight = 0;
        for (let enchantment of item.enchants) {
            if (enchantment.name in enchantmentWeights) {
                weight += enchantmentWeights[enchantment.name] * enchantment.lvl;
            } else {
                console.log("Unknown enchantment: " + enchantment.name);
            }
        }
        return weight;
    });

    let highest = Math.max(...itemRanks);
    return items[itemRanks.indexOf(highest)];
}


export function getFishingSpot(bot: Bot, waterId: number) {
    let blocks = bot.findBlocks({
        point: bot.entity.position.offset(0, bot.entity.height, 0),
        matching: waterId,
        maxDistance: 16,
        count: 2000
    })

    let blockSet = new Set(blocks);
    let block = blocks.filter(b => blockSet.has(b.offset(1, 0, 0)) && blockSet.has(b.offset(-1, 0, 0)) && blockSet.has(b.offset(0, 0, 1)) && blockSet.has(b.offset(0, 0, -1)));

    return block[0] || blocks[0];
}

export function getChestDeposits(bot: Bot, chestId: number) {
    let blocks = bot.findBlocks({
        point: bot.entity.position.offset(0, bot.entity.height, 0),
        matching: chestId,
        maxDistance: 32,
        count: 50
    })

    return blocks;
}

export async function gracefulItemDeposit(bot: Bot, chestId: number, items: Item[]) {
    let current = bot.entity.position;
    let chests = getChestDeposits(bot, chestId);

    for (const chestPos of chests) {

        await bot.pathfinder.goto(new goals.GoalLookAtBlock(chestPos, bot.world));
        let chest = await bot.openContainer(bot.blockAt(chestPos)!) as Chest;
        try {
            for (const item of items) {
                await placeItemStackInChest(bot, chest, item.name);
            }
        } catch (e) {
            console.log(e)
            continue;
        } finally {
            await chest.close();
        }
        break;
    }

    if (bot.inventory.items().filter(item => item.name !== "fishing_rod").length >= 3) {
        console.log("failed.", bot.inventory.items())
        throw "Did not clear all items to a chest.";
    }

    await bot.pathfinder.goto(new goals.GoalBlock(current.x, current.y, current.z));
}


export type ItemWithCount = { itemId: number, count: number };
export async function gracefulAcquireItemsFromChests(bot: Bot, chestId: number, itemInfo: ItemWithCount[]) {
    let tally: ItemWithCount[] = structuredClone(itemInfo);

    let current = bot.entity.position;
    let chests = getChestDeposits(bot, chestId);

    for (const chestPos of chests) {
        await bot.pathfinder.goto(new goals.GoalLookAtBlock(chestPos, bot.world));
        let chest = await bot.openContainer(bot.blockAt(chestPos)!) as Chest;
        try {
            for (const iInfo of tally) {
                let item: Item | undefined;
                do {
                    console.log(chest)
                    item = ((chest as any).slots as Item[]).find(item => item?.type === iInfo.itemId);
                    if (!item) break;
                    const num = Math.min(iInfo.count, item.count);
                    await chest.withdraw(iInfo.itemId, null, num);
                    iInfo.count -= num;
                } while (iInfo.count > 0);
               
              
            }
        } catch (e) {
            console.log(e)
            continue;
        } finally {
            await chest.close();
        }

        if (tally.every(item => item.count === 0)) break;
    }
    console.log(tally);
    if (itemInfo.some(i => bot.inventory.count(i.itemId, null) < i.count)) {
        console.log("failed.")
        throw "Did not get all items.";
    }

    await bot.pathfinder.goto(new goals.GoalBlock(current.x, current.y, current.z));
}


export async function gracefulFishing(bot: Bot, fishingConfig: FishingOptions, waterId: number, chestId: number, rodId: number) {
    let spot = getFishingSpot(bot, waterId).offset(0.5, 1, 0.5);
    let rod = getBestRod(bot);
    while (fishingConfig.fishing) {
        rod = getBestRod(bot)
        let org = bot.inventory.items();
        let items = org.filter(item => item.name !== "fishing_rod");
        if (org.length - items.length < 3 && items.length > 25) {
            console.log("dropping items")
            await gracefulItemDeposit(bot, chestId, items);
        }
        if (!rod) {
            console.log("getting rod")
            await gracefulAcquireItemsFromChests(bot, chestId, [{ itemId: rodId, count: 1 }]);

        } else {
            console.log("fishing")
            await bot.equip(rod, "hand");
            // await bot.pathfinder.goto(new goals.GoalLookAtBlock(spot, bot.world));
            await bot.lookAt(spot, true); // force alignment
            await bot.waitForTicks(1);
            try {
                await bot.customFisher.customFish();
                await bot.waitForTicks(10);
            }
            catch (e) {
                console.log(e);
            }
        }
    } 
}