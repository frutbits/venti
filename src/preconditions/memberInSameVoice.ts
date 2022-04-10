import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { CommandContext } from "../structures/CommandContext";

@ApplyOptions<PreconditionOptions>({
    name: "memberInSameVoice"
})
export class memberInSameVoice extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        return this.precondition(new CommandContext(interaction));
    }

    public messageRun(message: Message): PreconditionResult {
        return this.precondition(new CommandContext(message));
    }

    private precondition(ctx: CommandContext): PreconditionResult {
        const dispatcher = this.container.client.shoukaku.queue.get(ctx.context.guildId!);
        const voiceChannel = ctx.context.member!.voice.channel;
        if (dispatcher) {
            if (!dispatcher.listeners.length && voiceChannel?.joinable) {
                dispatcher.destroy();
                return this.ok();
            }
            if (
                ctx.context.guild!.me?.voice.channelId &&
                ctx.context.guild!.me.voice.channelId !== voiceChannel?.id &&
                dispatcher.listeners.length > 0 && !voiceChannel?.joinable
            ) {
                return this.error({ message: `I'm already being used in ${voiceChannel!.toString()}` });
            }
        }
        return this.ok();
    }
}
