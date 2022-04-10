import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { CommandContext } from "../structures/CommandContext";

@ApplyOptions<PreconditionOptions>({
    name: "memberVoiceJoinable"
})
export class memberVoiceJoinable extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        return this.precondition(new CommandContext(interaction));
    }

    public messageRun(message: Message): PreconditionResult {
        return this.precondition(new CommandContext(message));
    }

    private precondition(ctx: CommandContext): PreconditionResult {
        if (ctx.context.guild!.me?.voice.channelId === ctx.context.member!.voice.channelId) return this.ok();
        const voiceChannel = ctx.context.member!.voice.channel;
        if (!voiceChannel?.joinable) return this.error({ message: "I can't join to your voice channel." });
        if (voiceChannel.type === "GUILD_VOICE" && !voiceChannel.speakable) return this.error({ message: "I can't speak in your voice channel." });
        return this.ok();
    }
}
