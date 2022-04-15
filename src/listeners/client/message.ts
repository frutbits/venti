import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, MessageCommand, MessageCommandContext } from "@sapphire/framework";
import { Message } from "discord.js";
import { prefix } from "../../config";

@ApplyOptions<Listener.Options>({
    event: "messageCreate"
})
export class MessageListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public async run(message: Message): Promise<any> {
        const data = await this.container.client.prisma.guilds.findFirst({
            select: {
                requester_channel: true,
                requester_message: true,
                prefix: true
            },
            where: {
                id: message.guildId!,
                requester_channel: message.channelId
            }
        });
        if (data) {
            const requesterMessage = await message.channel.messages.fetch(data.requester_message!).catch(() => null);
            if (requesterMessage) {
                if (message.author.bot && message.author.id !== this.container.client.user?.id && message.deletable) await message.delete().catch(() => null);
                if ((!message.content.startsWith(data.prefix ?? prefix) && !message.content.startsWith(prefix)) && !message.author.bot) {
                    if (message.deletable) await message.delete();
                    const command = this.container.stores.get("commands").get("play") as MessageCommand;
                    const preconditionsResult = await command.preconditions.messageRun(message, command, { message, command });
                    const context: MessageCommandContext = {
                        commandName: "play",
                        commandPrefix: prefix,
                        prefix
                    };
                    if (!preconditionsResult.success) {
                        return message.client.emit(Events.MessageCommandDenied, preconditionsResult.error, { context, command, message, parameters: message.content });
                    }
                    return command.messageRun(message, await command.messagePreParse(message, message.content, context), context);
                }
            }
        }
    }
}
