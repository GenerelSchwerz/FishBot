"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismarine_registry_1 = __importDefault(require("prismarine-registry"));
const funcs = __importStar(require("./fisher_funcs"));
let bot;
let botConfig;
let fishingConfig = {
    fishing: false,
    autoEjecting: false,
    rods: 0,
};
let mcData;
process.on("message", async (message) => {
    const msg = message;
    if (!["init", "startBot", "startFish"].includes(msg.subject) && !bot)
        return;
    bot = bot; // lazy type coercion.
    switch (msg.subject) {
        case "init":
            botConfig = msg.data;
            mcData = (0, prismarine_registry_1.default)(botConfig.version);
            break;
        case "startBot":
            if (bot)
                bot.quit();
            bot = funcs.setupBot(botConfig, fishingConfig);
            break;
        case "startFish":
            if (!bot)
                bot = funcs.setupBot(botConfig, fishingConfig);
            await funcs.gracefulFishing(bot, mcData.blocksByName.water.id, mcData.blocksByName.chest.id);
            break;
        case "stopFish":
            if (!fishingConfig.fishing)
                return;
            break;
        case "resupply":
            break;
        case "dumpAllItems":
            await funcs.dropItems(bot);
            break;
        case "findNewSpot":
            break;
        case "stopBot":
            bot.quit();
            bot = undefined;
            break;
        default:
            console.log("Unknown message: ", msg);
            break; //unneeded
    }
});
