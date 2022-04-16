import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ShoukakuPlayer, TrackStartEvent } from "shoukaku";
import { Util } from "../../utils/Util";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "playerTrackStart",
    name: "shoukaku:playerTrackStart"
})
export class ShoukakuPlayerTrackStartListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public async run(player: ShoukakuPlayer, data: TrackStartEvent): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(data.guildId);
        if (!dispatcher) return;
        void dispatcher.embedPlayer?.update();
        if (!dispatcher.embedPlayer?.message) {
            dispatcher.oldMusicMessage = await dispatcher.textChannel.send({
                embeds: [
                    Util.createEmbed("info", `Started playing: \`${dispatcher.queue[0].displayTitle}\``)
                ]
            }).then(x => x.id);
        }
    }
}
