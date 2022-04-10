import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";

@ApplyOptions<PreconditionOptions>({
    name: "isNodeAvailable"
})
export class isNodeAvailable extends Precondition {
    public chatInputRun(): PreconditionResult {
        return [...this.container.client.shoukaku.nodes.values()].some(n => !n.destroyed) ? this.ok() : this.error({ message: "There's no node available" });
    }
}
