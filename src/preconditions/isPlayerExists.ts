import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { CommandContext } from "../structures/CommandContext";

@ApplyOptions<PreconditionOptions>({
    name: "isPlayerExists"
})
export class isPlayerExists extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        return this.precondition(new CommandContext(interaction));
    }

    public messageRun(message: Message): PreconditionResult {
        return this.precondition(new CommandContext(message));
    }

    private precondition(ctx: CommandContext): PreconditionResult {
        if (!this.container.client.shoukaku.queue.get(ctx.context.guildId!)) {
            return this.error({
                message: "I'm not playing anything right now"
            });
        }
        return this.ok();
    }
}
