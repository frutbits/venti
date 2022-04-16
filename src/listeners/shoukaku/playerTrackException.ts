import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ShoukakuPlayer, TrackExceptionEvent } from "shoukaku";
import { Util } from "../../utils/Util";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "playerTrackException",
    name: "shoukaku:playerTrackException"
})
export class ShoukakuPlayerTrackExceptionListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public async run(player: ShoukakuPlayer, data: TrackExceptionEvent): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(data.guildId);
        if (!dispatcher) return undefined;
        dispatcher.oldExceptionMessage = await dispatcher.textChannel.send({
            embeds: [
                Util.createEmbed("error", `There is an exception while trying to play this track:\n\`\`\`java\n${data.exception!.message}\`\`\``, true)
            ]
        }).then(x => x.id);
        if (dispatcher.embedPlayer?.textChannel) {
            setTimeout(() => dispatcher.oldExceptionMessage = null, 5000);
        }
    }
}
