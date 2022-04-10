import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "ready",
    name: "shoukaku:ready"
})
export class ShoukakuReadyListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public run(name: string, resumed: boolean): any {
        this.container.client.logger.info(`Shoukaku: ${name} has ${resumed ? "re" : ""}connected`);
    }
}
