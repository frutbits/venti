import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "close",
    name: "shoukaku:close"
})
export class ShoukakuCloseListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public run(name: string, code: number, reason = "Unknown"): any {
        this.container.client.logger.error(`Shoukaku: ${name}'s connection has been closed with code ${code}. Reason: ${reason}`);
    }
}
