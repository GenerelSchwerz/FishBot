import { Serializable } from "child_process";

// htw = HostToWorker
// wth = WorkerToHost
export type htwCommands = "init" | "startBot"  |  "stopBot" | "startFish" | "stopFish" | "resupply" | "dumpAllItems" | "findNewSpot" | "goto" | "come";
export type wthReplies = "botSpawned" | "botError" | "startFished" | "stopFishped";

export type htwMessage = {
    subject: htwCommands;
    data: Serializable;
};

export type wthMessage = {
    subject: wthReplies;
    data: Serializable;
};



export type FishingOptions = { fishing: boolean, autoEjecting: boolean, rods: number }

