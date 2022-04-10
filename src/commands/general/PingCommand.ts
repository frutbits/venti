import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, RegisterBehavior } from "@sapphire/framework";
import { ColorResolvable, CommandInteraction, Message, MessageEmbed, User } from "discord.js";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "ping",
    description: "Shows the current ping of the bot",
    chatInputCommand: {
        register: true,
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite
    }
})
export class PingCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }

    public messageRun(message: Message): any {
        message.channel.send("🏓 Pong!").then(msg => {
            msg.edit({
                content: " ",
                embeds: [this.generateResponse(msg.createdTimestamp - message.createdTimestamp, message.author)]
            }).catch(e => this.container.logger.error(e));
        }).catch(e => this.container.logger.error(e));
    }

    public async chatInputRun(interaction: CommandInteraction<"cached">): Promise<any> {
        const msg = await interaction.reply({ content: "🏓 Pong!", fetchReply: true });
        return interaction.editReply({
            embeds: [this.generateResponse(msg.createdTimestamp - interaction.createdTimestamp, interaction.user)]
        });
    }

    private generateResponse(latency: number, author: User): MessageEmbed {
        const wsLatency = this.container.client.ws.ping.toFixed(0);
        return new MessageEmbed()
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
            .setFooter({ text: `Requested by: ${author.tag}`, iconURL: author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
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
