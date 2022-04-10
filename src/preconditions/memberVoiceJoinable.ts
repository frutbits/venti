import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction } from "discord.js";

@ApplyOptions<PreconditionOptions>({
    name: "memberVoiceJoinable"
})
export class memberVoiceJoinable extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        if (interaction.guild.me?.voice.channelId === interaction.member.voice.channelId) return this.ok();
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel?.joinable) return this.error({ message: "I can't join to your voice channel." });
        if (voiceChannel.type === "GUILD_VOICE" && !voiceChannel.speakable) return this.error({ message: "I can't speak in your voice channel." });
        return this.ok();
    }
}
