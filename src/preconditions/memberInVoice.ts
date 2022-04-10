import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { CommandContext } from "../structures/CommandContext";

@ApplyOptions<PreconditionOptions>({
    name: "memberInVoice"
})
export class memberInVoice extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        return this.precondition(new CommandContext(interaction));
    }

    public messageRun(message: Message): PreconditionResult {
        return this.precondition(new CommandContext(message));
    }

    private precondition(ctx: CommandContext): PreconditionResult {
        return ctx.context.member!.voice.channelId ? this.ok() : this.error({ message: "Please connect to a voice channel" });
    }
}
