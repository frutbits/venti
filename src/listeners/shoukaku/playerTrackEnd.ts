import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ShoukakuPlayer, TrackStartEvent } from "shoukaku";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "playerTrackEnd",
    name: "shoukaku:playerTrackEnd"
})
export class ShoukakuPlayerTrackEndListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public run(player: ShoukakuPlayer, data: TrackStartEvent): any {
        const dispatcher = this.container.client.shoukaku.queue.get(data.guildId);
        if (!dispatcher) return undefined;
        // TODO: Handle queue shifting here
    }
}
