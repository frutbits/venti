import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
    emitter: "shoukaku",
    event: "error",
    name: "shoukaku:error"
})
export class ShoukakuErrorListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public run(name: string, error: Error): any {
        this.container.client.logger.error(`Shoukaku: ${name} throwing an error:`, error);
    }
}
