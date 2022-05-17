
import { Bot } from "mineflayer"
import { Vec3 } from "vec3"
import { createDoneTask, createTask, sleep } from './promise_utils'
import { Entity } from "prismarine-entity"

export class CustomFisher {
  private fishingTask;
  private lastBobber: Entity | null;
  private bobberId;
  private bot: Bot;


  constructor(bot: Bot) {
    this.bot = bot;
    this.bobberId = 90
    this.lastBobber = null;
    // Before 1.14 the bobber entity keep changing name at each version (but the id stays 90)
    // 1.14 changes the id, but hopefully we can stick with the name: fishing_bobber
    // the alternative would be to rename it in all version of mcData
    if (bot.supportFeature('fishingBobberCorrectlyNamed')) {
      this.bobberId = (bot as any).registry.entitiesByName.fishing_bobber.id
    }


    this.fishingTask = createDoneTask();

    this.bot._client.on('spawn_entity', (packet: any) => {
      if (packet.type === this.bobberId && !this.fishingTask.done && !this.lastBobber) {
        let tmp = new Vec3(packet.x, packet.y, packet.z);
        if (tmp.xzDistanceTo(bot.entity.position) < 0.31) {
          this.lastBobber = bot.entities[packet.entityId]
        }
      }
    })

    this.bot._client.on('world_particles', (packet: any) => {
      if (!this.lastBobber || this.fishingTask.done) return
      const pos = this.lastBobber.position
      const parts = (bot as any).registry.particlesByName
      if (packet.particleId === (parts?.fishing ?? parts.bubble).id && packet.particles === 6 && pos.distanceTo(new Vec3(packet.x, pos.y, packet.z)) <= 1.23) {
        this.potentialBobber(pos.clone()).then(res => {
          if (res) this.retractRod()
        })

      }
    })

    this.bot._client.on('entity_destroy', (packet: any) => {
      if (!this.lastBobber) return
      if ((packet.entityIds as number[]).some(id => id === this.lastBobber!.id)) {
        this.lastBobber = null;
        this.fishingTask.cancel(new Error('Fishing cancelled'))
      }
    })
  }


  private potentialBobber = async (oldPos: Vec3) => {
    const start = performance.now()
    while (performance.now() - start < 250) {
      if (!this.lastBobber) return false;
      if (oldPos.y - this.lastBobber.position.y > 0.25) return true;
      else await sleep(50);
    }
    return false;

  }

  private retractRod = () => {
    this.bot.activateItem()
    this.lastBobber = null;
    this.fishingTask.finish()
  }


  isFishing(): boolean {
    return !this.fishingTask.done;
  }

  customFish = async () => {
    if (!this.fishingTask.done) {
      this.fishingTask.cancel(new Error('Fishing cancelled due to calling bot.fish() again'))
    }

    this.fishingTask = createTask()

    this.bot.activateItem()

    await this.fishingTask.promise
  }

  cancelFishGracefully = async () => {
    if (!this.fishingTask.done) this.retractRod();
  }



}



declare module "mineflayer" {
  export interface Bot {
    customFisher: CustomFisher
  }
}


export function inject(bot: Bot) {
  bot.customFisher = new CustomFisher(bot)
  bot.fish = bot.customFisher.customFish
}
