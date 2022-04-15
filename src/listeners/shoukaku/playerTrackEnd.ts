import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ShoukakuPlayer, TrackEndEvent } from "shoukaku";
import { LoopType } from "../../structures/Dispatcher";
import { Util } from "../../utils/Util";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "playerTrackEnd",
    name: "shoukaku:playerTrackEnd"
})
export class ShoukakuPlayerTrackEndListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public async run(player: ShoukakuPlayer, data: TrackEndEvent): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(data.guildId);
        if (!dispatcher) return undefined;
        if (data.reason === "REPLACED") return;
        dispatcher.queue.previousTrack = dispatcher.queue[0];
        dispatcher.queue.shift();
        if (["LOAD_FAILED", "CLEAN_UP"].includes(data.reason)) {
            if (dispatcher.queue.length) return player.playTrack(dispatcher.queue[0].base64);
        }
        if (dispatcher.loopState === LoopType.ALL) dispatcher.queue.push(dispatcher.queue.previousTrack);
        if (dispatcher.loopState === LoopType.ONE) dispatcher.queue.unshift(dispatcher.queue.previousTrack);
        void dispatcher.embedPlayer?.update();
        if (dispatcher.queue.length) return player.playTrack(dispatcher.queue[0].base64);
        if (!dispatcher.embedPlayer?.message) {
            dispatcher.oldMusicMessage = await dispatcher.textChannel.send({
                embeds: [
                    Util.createEmbed("info", "We've run out of songs! Better queue up some more tunes.")
                        .setAuthor({ name: "Queue Concluded" })
                ]
            }).then(x => x.id);
        }
        return dispatcher.destroy();
    }
}
