import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, Command, RegisterBehavior } from "@sapphire/framework";
import { ApplicationCommandOptionData, CommandInteraction, Message } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { devGuilds, isDev } from "../../config";
import { CommandContext } from "../../structures/CommandContext";
import { LoopType } from "../../structures/Dispatcher";
import { Util } from "../../utils/Util";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "loop",
    preconditions: ["isPlayerPlaying", "memberInVoice", "memberVoiceJoinable", "memberInSameVoice"],
    description: "Customize loop mode for current queue",
    chatInputCommand: {
        register: true
    },
    requiredClientPermissions: ["EMBED_LINKS"]
})
export class LoopCommand extends Command {
    private readonly commands: ApplicationCommandOptionData[] = [
        {
            name: "queue",
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Loop current queue"
        },
        {
            name: "track",
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Loop current track (single)"
        },
        {
            name: "disable",
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Disable loop"
        }
    ];

    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.commands
        }, {
            registerCommandIfMissing: true,
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
            guildIds: isDev ? devGuilds : []
        });
    }

    public async chatInputRun(interaction: CommandInteraction<"cached">): Promise<any> {
        return this.run(interaction.options.getSubcommand(true), new CommandContext(interaction));
    }

    public async messageRun(message: Message, args: Args): Promise<any> {
        const cmd = await args.pickResult("string");
        const validCommands = this.commands.map(x => x.name);
        const dispatcher = this.container.client.shoukaku.queue.get(message.guildId!);
        if (!cmd.success || !validCommands.includes(cmd.value.toLowerCase())) {
            const msg = await message.channel.send({
                embeds: [
                    Util.createEmbed("error", `Invalid sub-command. Available sub-command: ${validCommands.map(x => `\`${x}\``).join(", ")}`)
                ]
            });
            if (dispatcher?.embedPlayer?.textChannel?.id === message.channelId) {
                setTimeout(() => {
                    if (msg.deletable) return msg.delete();
                }, 5000);
            }
            return undefined;
        }
        return this.run(cmd.value.toLowerCase(), new CommandContext(message, args));
    }

    public async run(command: string, ctx: CommandContext): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(ctx.context.guildId!);
        if (dispatcher?.embedPlayer?.textChannel?.id === ctx.context.channelId) ctx.isInsideRequesterChannel = true;
        switch (command) {
            case "queue": {
                dispatcher!.loopState = LoopType.ALL;
                await ctx.send({
                    embeds: [
                        Util.createEmbed("success", "🔁 **|** Repeating current queue")
                    ]
                });
                break;
            }
            case "track": {
                dispatcher!.loopState = LoopType.ONE;
                await ctx.send({
                    embeds: [
                        Util.createEmbed("success", "🔂 **|** Repeating current track")
                    ]
                });
                break;
            }
            case "disable": {
                dispatcher!.loopState = LoopType.NONE;
                await ctx.send({
                    embeds: [
                        Util.createEmbed("success", "Disabled loop", true)
                    ]
                });
                break;
            }
        }
        await dispatcher?.embedPlayer?.update();
    }
}
