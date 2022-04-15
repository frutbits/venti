import { Events, Listener, MessageCommandDeniedPayload, UserError } from "@sapphire/framework";

export class MessageCommandDeniedListener extends Listener<typeof Events.MessageCommandDenied> {
    // eslint-disable-next-line class-methods-use-this
    public override async run({ context, message: content }: UserError, { message }: MessageCommandDeniedPayload): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (Reflect.get(Object(context), "silent")) return;
        const msg = await message.channel.send({
            content,
            allowedMentions: { users: [message.author.id], roles: [] }
        });
        if ((await this.container.client.databases.guild.fetchGuildRequester(message.guildId!)).channel === message.channelId) {
            setTimeout(async () => {
                if (msg.deletable) await msg.delete();
            }, 5000);
        }
    }
}
