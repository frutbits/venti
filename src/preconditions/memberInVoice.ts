import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, PreconditionOptions, PreconditionResult } from "@sapphire/framework";
import { CommandInteraction } from "discord.js";

@ApplyOptions<PreconditionOptions>({
    name: "memberInVoice"
})
export class memberInVoice extends Precondition {
    public chatInputRun(interaction: CommandInteraction<"cached">): PreconditionResult {
        return interaction.member.voice.channelId ? this.ok() : this.error({ message: "Please connect to a voice channel" });
    }
}
