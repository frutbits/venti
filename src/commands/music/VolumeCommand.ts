import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, Command, RegisterBehavior } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { devGuilds, isDev } from "../../config";
import { CommandContext } from "../../structures/CommandContext";
import { Util } from "../../utils/Util";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "volume",
    description: "Change current playback volume",
    preconditions: ["isPlayerPlaying", "memberInVoice", "memberVoiceJoinable", "memberInSameVoice"],
    chatInputCommand: {
        register: true
    },
    requiredClientPermissions: ["EMBED_LINKS"]
})
export class VolumeCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: "volume",
                    description: "Volume to set",
                    type: "INTEGER",
                    required: true
                }
            ]
        }, {
            registerCommandIfMissing: true,
            guildIds: isDev ? devGuilds : [],
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite
        });
    }

    public async chatInputRun(interaction: CommandInteraction<"cached">): Promise<any> {
        return this.run(new CommandContext(interaction));
    }

    public messageRun(message: Message, args: Args): Promise<any> {
        return this.run(new CommandContext(message, args));
    }

    public async run(ctx: CommandContext): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(ctx.context.guildId!);
        if (dispatcher?.embedPlayer?.textChannel?.id === ctx.context.channelId) ctx.isInsideRequesterChannel = true;
        const argsVolume = await ctx.args?.restResult("integer");
        if (!argsVolume?.success && !ctx.options) {
            return ctx.send({
                embeds: [
                    Util.createEmbed("error", "Please provide a valid number between 1 - 100", true)
                ]
            });
        }
        const volume = argsVolume?.value ?? ctx.options?.getInteger("volume", true);
        if (!volume || isNaN(volume) || volume < 1 || volume > 100) {
            return ctx.send({
                embeds: [
                    Util.createEmbed("error", "Please provide a valid number between 1 - 100", true)
                ]
            });
        }
        dispatcher?.player?.setVolume(volume / 100);
        await ctx.send({
            embeds: [
                Util.createEmbed("success", `🔊 **|** Changed current volume to ${volume}%`)
            ]
        });
        return dispatcher?.embedPlayer?.update();
    }
}
