/// <reference types="node" />
import { Serializable } from "child_process";
export declare type htwCommands = "init" | "startBot" | "startFish" | "stopFish" | "resupply" | "dumpAllItems" | "findNewSpot" | "stopBot";
export declare type wthReplies = "botSpawned" | "botError" | "startFished" | "stopFishped";
export declare type htwMessage = {
    subject: htwCommands;
    data: Serializable;
};
export declare type wthMessage = {
    subject: wthReplies;
    data: Serializable;
};
export declare type FishingOptions = {
    fishing: boolean;
    autoEjecting: boolean;
    rods: number;
};
