"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const config_json_1 = __importDefault(require("./config.json"));
const readline_1 = __importDefault(require("readline"));
const controller = new AbortController();
const { signal } = controller;
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const children = [];
for (let i = 0; i < Math.min(os_1.default.cpus().length, config_json_1.default.amount); i++) {
    console.log(path_1.default.join(path_1.default.dirname(__filename), "./worker", "fisher.ts"));
    const child = (0, child_process_1.fork)(path_1.default.join(path_1.default.dirname(__filename), "./worker", "fisher." + __filename.split(".")[1]), { signal });
    console.log(config_json_1.default);
    console.log(config_json_1.default.slaves.username + config_json_1.default.slaves.identifier.replace("{x}", i.toString()));
    child.send({
        subject: "init",
        data: config_json_1.default
    });
    child.send({
        subject: "startBot",
        data: {
            username: config_json_1.default.slaves.username + config_json_1.default.slaves.identifier.replace("{x}", i.toString()),
            // password: config.password,
            host: config_json_1.default.host,
            port: config_json_1.default.port,
            version: config_json_1.default.version
        }
    });
    children.push(child);
}
for (const child of children) {
    child.on("exit", (code, signals) => {
        console.log(code, signals);
    });
}
function sendToChildren(children, data) {
    for (const child of children) {
        child.send(data);
    }
}
rl.on("line", (line) => {
    switch (line) {
        case "start":
            sendToChildren(children, { subject: "startBot", data: {} });
            break;
        case "stop":
            sendToChildren(children, { subject: "stopBot", data: {} });
            break;
        case "fish":
            sendToChildren(children, { subject: "startFish", data: {} });
        default:
            break;
    }
});
