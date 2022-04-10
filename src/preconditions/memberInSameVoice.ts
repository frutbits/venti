import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction } from "discord.js";

@ApplyOptions<PreconditionOptions>({
    name: "memberInSameVoice"
})
export class memberInSameVoice extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        const dispatcher = this.container.client.shoukaku.queue.get(interaction.guildId);
        const voiceChannel = interaction.member.voice.channel;
        if (dispatcher) {
            if (dispatcher.listeners.length && voiceChannel?.joinable) {
                dispatcher.destroy();
                return this.ok();
            }
            if (interaction.guild.me?.voice.channelId && interaction.guild.me.voice.channelId !== voiceChannel?.id && dispatcher.listeners.length > 0 && !voiceChannel?.joinable) {
                return this.error({ message: `I'm already being used in ${voiceChannel!.toString()}` });
            }
        }
        return this.ok();
    }
}
