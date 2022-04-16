import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, Command, RegisterBehavior } from "@sapphire/framework";
import { ApplicationCommandOptionData, CommandInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { devGuilds, isDev, prefix } from "../../config";
import { CommandContext } from "../../structures/CommandContext";
import { EmbedPlayer } from "../../utils/EmbedPlayer";
import { Util } from "../../utils/Util";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "set",
    description: "Customize bot's settings",
    chatInputCommand: {
        register: true
    },
    requiredUserPermissions: ["MANAGE_GUILD"]
})
export class SettingCommand extends Command {
    private readonly commands: ApplicationCommandOptionData[] = [
        {
            name: "requester",
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Set text channel requester",
            options: [
                {
                    name: "channel",
                    type: ApplicationCommandOptionTypes.CHANNEL,
                    description: "Text channel to set",
                    required: true
                }
            ]
        },
        {
            name: "removerequester",
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Remove text channel requester"
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
        await interaction.deferReply();
        return this.run(interaction.options.getSubcommand(true), new CommandContext(interaction));
    }

    public async messageRun(message: Message, args: Args): Promise<any> {
        const cmd = await args.pickResult("string");
        const validCommands = this.commands.map(x => x.name);
        if (!cmd.success || !validCommands.includes(cmd.value.toLowerCase())) {
            return message.channel.send({
                embeds: [
                    Util.createEmbed("error", `Invalid sub-command. Available sub-command: ${validCommands.map(x => `\`${x}\``).join(", ")}`)
                ]
            });
        }
        return this.run(cmd.value.toLowerCase(), new CommandContext(message, args));
    }

    public async run(command: string, ctx: CommandContext): Promise<any> {
        switch (command) {
            case "requester": {
                const channelArgs = await ctx.args?.pick("channel");
                const channel = ctx.options?.getChannel("channel", true);
                if ((!channelArgs?.isText() && !ctx.options) || (!ctx.args && !channel?.isText())) {
                    return ctx.send({
                        embeds: [
                            Util.createEmbed("error", "Please mention a valid **text channel**")
                        ]
                    });
                }
                const data = await this.container.client.databases.guild.get(ctx.context.guildId!, {
                    select: {
                        requester_channel: true,
                        requester_message: true
                    }
                });
                const oldRequester = ctx.context.guild!.channels.cache.get(data.requester_channel!);
                if (oldRequester?.isText()) {
                    const message = await oldRequester.messages.fetch(data.requester_message!).catch(() => undefined);
                    if (message) {
                        return ctx.send({
                            // eslint-disable-next-line @typescript-eslint/no-base-to-string
                            embeds: [Util.createEmbed("error", `Already setup in ${oldRequester.toString()}`)]
                        });
                    }
                }
                if (!channel?.permissionsFor(this.container.client.user!.id)?.has(["SEND_MESSAGES", "ATTACH_FILES"])) {
                    return ctx.send({
                        embeds: [Util.createEmbed("error", "I need these permissions to make requester channel: `SEND_MESSAGES`, `ATTACH_FILES`")]
                    });
                }
                if (channel.isText()) {
                    data.requester_channel = channel.id;
                    const msg = await channel.send({
                        embeds: [
                            EmbedPlayer.generateDefaultEmbed(ctx.context.guild!, data.prefix ?? prefix)
                        ],
                        components: [
                            new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId("player_resumepause")
                                        .setEmoji("⏯")
                                        .setStyle("SECONDARY"),
                                    new MessageButton()
                                        .setCustomId("player_skip")
                                        .setEmoji("⏭")
                                        .setStyle("SECONDARY"),
                                    new MessageButton()
                                        .setCustomId("player_loop")
                                        .setEmoji("🔁")
                                        .setStyle("SECONDARY"),
                                    new MessageButton()
                                        .setCustomId("player_stop")
                                        .setEmoji("⏹")
                                        .setStyle("DANGER"),
                                    new MessageButton()
                                        .setCustomId("player_shuffle")
                                        .setEmoji("🔀")
                                        .setStyle("SUCCESS")
                                )
                        ]
                    }).catch((e: Error) => ({ error: e.message }));
                    if ("error" in msg) {
                        return ctx.send({
                            embeds: [
                                Util.createEmbed("error", `Couldn't send player message: \`${msg.error}\``, true)
                            ]
                        });
                    }
                    data.requester_message = msg.id;
                }
                await this.container.client.prisma.guilds.update({
                    where: { id: ctx.context.guildId! },
                    data
                });
                await ctx.send({
                    embeds: [Util.createEmbed("info", `Set requester channel to: <#${data.requester_channel!}>`)]
                });
                break;
            }
            case "removerequester": {
                const oldRequester = await EmbedPlayer.resolveRequesterChannel(
                    ctx.context.guild!,
                    await this.container.client.databases.guild.fetchGuildRequester(ctx.context.guildId!)
                );
                if (!oldRequester.channel) {
                    return ctx.send({
                        embeds: [Util.createEmbed("error", "There's no requester channel in this server")]
                    });
                }
                if (oldRequester.message?.deletable) await oldRequester.message.delete();
                await this.container.client.prisma.guilds.update({
                    where: { id: ctx.context.guildId! },
                    data: {
                        requester_channel: null,
                        requester_message: null
                    }
                });
                await ctx.send({
                    embeds: [Util.createEmbed("info", "Deleted requester channel")]
                });
                break;
            }
        }
    }
}
