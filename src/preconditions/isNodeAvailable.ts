import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { State } from "shoukaku/dist/src/Constants";

@ApplyOptions<PreconditionOptions>({
    name: "isNodeAvailable"
})
export class isNodeAvailable extends Precondition {
    public chatInputRun(): PreconditionResult {
        return this.precondition();
    }

    public messageRun(): PreconditionResult {
        return this.precondition();
    }

    private precondition(): PreconditionResult {
        return [...this.container.client.shoukaku.nodes.values()].some(n => n.state === State.CONNECTED) ? this.ok() : this.error({ message: "There's no node available" });
    }
}
