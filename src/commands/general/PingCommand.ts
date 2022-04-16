import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, RegisterBehavior } from "@sapphire/framework";
import { ColorResolvable, CommandInteraction, Message, MessageEmbed } from "discord.js";
import { devGuilds, isDev } from "../../config";
import { CommandContext } from "../../structures/CommandContext";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "ping",
    preconditions: ["isInsideRequester"],
    description: "Shows the current ping of the bot",
    chatInputCommand: {
        register: true
    },
    requiredClientPermissions: ["EMBED_LINKS"]
})
export class PingCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        }, {
            guildIds: isDev ? devGuilds : [],
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
            registerCommandIfMissing: true
        });
    }

    public messageRun(message: Message): any {
        return this.run(new CommandContext(message));
    }

    public chatInputRun(interaction: CommandInteraction<"cached">): any {
        return this.run(new CommandContext(interaction));
    }

    public run(ctx: CommandContext): any {
        ctx.send({ content: "🏓 Pong!" }, true).then(msg => {
            const wsLatency = this.container.client.ws.ping.toFixed(0);
            if (msg) {
                const latency = msg.createdTimestamp - ctx.context.createdTimestamp;
                msg.edit({
                    content: " ",
                    embeds: [
                        new MessageEmbed()
                            .setAuthor({ name: "🏓 PONG!", iconURL: this.container.client.user!.displayAvatarURL() })
                            .setColor(PingCommand.searchHex(wsLatency))
                            .addFields({
                                name: "📶 API Latency",
                                value: `**\`${latency}\`** ms`,
                                inline: true
                            }, {
                                name: "🌐 WebSocket Latency",
                                value: `**\`${wsLatency}\`** ms`,
                                inline: true
                            })
                            .setFooter({ text: `Requested by: ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL({ dynamic: true }) })
                            .setTimestamp()
                    ]
                }).catch(e => this.container.logger.error(e));
            }
        }).catch(e => this.container.logger.error(e));
    }

    private static searchHex(ms: number | string): ColorResolvable {
        const listColorHex = [
            [0, 20, "#0DFF00"],
            [21, 50, "#0BC700"],
            [51, 100, "#E5ED02"],
            [101, 150, "#FF8C00"],
            [150, 200, "#FF6A00"]
        ];

        const defaultColor = "#FF0D00";

        const min = listColorHex.map(e => e[0]);
        const max = listColorHex.map(e => e[1]);
        const hex = listColorHex.map(e => e[2]);
        let ret: number | string = "#000000";

        for (let i = 0; i < listColorHex.length; i++) {
            if (min[i] <= ms && ms <= max[i]) {
                ret = hex[i];
                break;
            } else {
                ret = defaultColor;
            }
        }
        return ret as ColorResolvable;
    }
}
