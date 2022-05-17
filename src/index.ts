

import { ChildProcess, fork } from "child_process";
import path from "path";
import cpu from "os";
import { Bot, BotOptions, createBot } from "mineflayer";
import config from "./config.json"
import readline from "readline";
import { htwCommands, htwMessage, wthMessage } from "./worker/types";
import { CustomFisher } from "./worker/dep/better_fishing";

const controller = new AbortController();
const { signal } = controller;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

declare namespace mineflayer {
    export interface Bot {
      customFisher: CustomFisher
    }
  }
  

type NameAndProcess = { name: string, process: ChildProcess };
let children: NameAndProcess[] = [];
for (let i = 0; i < Math.min(1000/*cpu.cpus().length */, config.amount); i++) {
    const child = fork(path.join(path.dirname(__filename), "./worker", "fisher." + __filename.split(".")[1]), { signal });
    const username = config.slaves.use_list ? (config.slaves.slave_list[i] as any).username as string ?? config.slaves.username + config.slaves.identifier.replace("{x}", i.toString()) : config.slaves.username + config.slaves.identifier.replace("{x}", i.toString())
    const password = config.slaves.use_list ? (config.slaves.slave_list[i] as any).password as string : "";


    let botConfig = {
        username,
        host: config.host,
        port: config.port,
        version: config.version
    } as BotOptions;
    if (password !== "") botConfig.password = password;

    child.send({
        subject: "init",
        data: botConfig
    });

    child.send({
        subject: "startBot",
        data: {}
    });

    children.push({ name: username, process: child });
}


for (const { name, process } of children) {
    process.on("exit", (code, signals) => {
        console.log(code, signals);
        children = children.filter(({ name: n }) => n !== name);
    });

}


function sendToChildren(children: NameAndProcess[], data: htwMessage) {
    for (const { name, process } of children) {
        process.send(data);
    }
}

function sendToChild(nameIt: string, children: NameAndProcess[], data: htwMessage) {
    children.find(({ name }) => name === nameIt)?.process.send(data);
}

rl.on("line", (line) => {
    switch (line) {
        case "start":
            sendToChildren(children, { subject: "startBot", data: {} });
            break;
        case "fish":
            sendToChildren(children, { subject: "startFish", data: {} });
            break;
        case "stopbot":
            sendToChildren(children, { subject: "stopBot", data: {} });
            break;
        case "stopfish":
            sendToChildren(children, { subject: "stopFish", data: {} });
            break;
        case "restart":
            sendToChildren(children, { subject: "stopBot", data: {} });
            sendToChildren(children, { subject: "startFish", data: {} });
            break;
        default:
            sendToChildren(children, { subject: line as htwCommands, data: {} });
            break;
    }
})


const bot = createBot({
    username: config.leader.username,
    // password: config.leader.password,
    host: config.host,
    port: config.port,
    version: config.version
})

// bot.on("physicsTick", () => console.log(bot.nearestEntity(e => e.username === "Generel_Schwerz")?.metadata))

bot.on("chat", (username, message) => {

    const msg = message.split(" ");
    console.log(msg);
    if (!!children.find(({ name }) => name === msg[0])) {
        switch (msg[1]) {
            case "start":
                sendToChild(msg[0], children, { subject: "startBot", data: {} });
                break;
            case "fish":
                sendToChild(msg[0], children, { subject: "startFish", data: {} });
                break;
            case "stopbot":
                sendToChild(msg[0], children, { subject: "stopBot", data: {} });
                break;
            case "stopfish":
                sendToChild(msg[0], children, { subject: "stopFish", data: {} });
                break;
            case "come":
                const wantedPos = bot.nearestEntity(e => e.username === username)?.position;
                if (!wantedPos) {
                    bot.chat("I can't find you!");
                    break;
                }
                sendToChild(msg[0], children, { subject: "goto", data: { x: wantedPos.x, y: wantedPos.y, z: wantedPos.z } });
                break;
            case "goto":
                sendToChild(msg[0], children, { subject: "goto", data: { x: parseInt(msg[2]), y: parseInt(msg[3]), z: parseInt(msg[4]) } });
                break;
            case "restart":
                sendToChild(msg[0], children, { subject: "stopBot", data: {} });
                sendToChild(msg[0], children, { subject: "startBot", data: {} });
                break;
            default:
                sendToChild(msg[0], children, { subject: msg[1] as htwCommands, data: {} });
                break;
        }
    } else {
        switch (msg[0]) {
            case "start":
                sendToChildren(children, { subject: "startBot", data: {} });
                break;
            case "fish":
                sendToChildren(children, { subject: "startFish", data: {} });
                break;
            case "stopbot":
                sendToChildren(children, { subject: "stopBot", data: {} });
                break;
            case "stopfish":
                sendToChildren(children, { subject: "stopFish", data: {} });
                break;
            case "come":
                const wantedPos = bot.nearestEntity(e => e.username === username)?.position;
                if (!wantedPos) {
                    bot.chat("I can't find you!");
                    break;
                }
                sendToChildren(children, { subject: "goto", data: { x: wantedPos.x, y: wantedPos.y, z: wantedPos.z } });
                break;
            case "goto":
                sendToChildren(children, { subject: "goto", data: { x:  parseInt(msg[1]), y: parseInt(msg[2]), z: parseInt(msg[3])  } });
                break;
            case "restart":
                sendToChildren(children, { subject: "stopBot", data: {} });
                sendToChildren(children, { subject: "startBot", data: {} });
                break;
            default:
                sendToChildren(children, { subject: msg[0] as htwCommands, data: {} });
                break;
        }
    }
})
