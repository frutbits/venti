/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Events, Identifiers, Listener, MessageCommandDeniedPayload, UserError } from "@sapphire/framework";
import { MessageOptions, PermissionString } from "discord.js";
import { Util } from "../../../utils/Util";

export class MessageCommandDeniedListener extends Listener<typeof Events.MessageCommandDenied> {
    // eslint-disable-next-line class-methods-use-this
    public override async run({ context, message: content, identifier }: UserError, { message }: MessageCommandDeniedPayload): Promise<any> {
        if (Reflect.get(Object(context), "silent")) return;
        const payload: MessageOptions = {
            embeds: [
                Util.createEmbed("error", content, true)
            ]
        };
        const cooldownRemaining = Reflect.get(Object(context), "remaining") as number | undefined;
        if (cooldownRemaining && identifier === Identifiers.PreconditionCooldown) {
            payload.embeds = [
                Util.createEmbed("error", `**${message.author.username}**, please wait **${cooldownRemaining.toFixed(1)}** cooldown time.`, true)
            ];
        }
        const missingPerms = Reflect.get(Object(context), "missing") as PermissionString[] | undefined;
        if (missingPerms && [Identifiers.PreconditionClientPermissions, Identifiers.PreconditionUserPermissions].includes(identifier as Identifiers)) {
            payload.embeds = [
                Util.createEmbed("error", `${identifier === Identifiers.PreconditionClientPermissions ? "I am" : "You are"} missing the following permissions to run this command:\n\`\`\`diff\n${missingPerms.map(x => `- ${Util.readablePermissions[x]}`).join("\n")}\`\`\``, true)
            ];
        }
        if (message.channel.type !== "DM") {
            if (!message.channel.permissionsFor(message.guild!.me!).has("EMBED_LINKS")) {
                payload.content = payload.embeds![0].description;
                payload.embeds = [];
            }
        }
        const msg = await message.channel.send({
            ...payload,
            allowedMentions: { users: [message.author.id], roles: [] }
        });
        if ((await this.container.client.databases.guild.fetchGuildRequester(message.guildId!)).channel === message.channelId) {
            setTimeout(async () => {
                if (msg.deletable) await msg.delete();
            }, 5000);
        }
    }
}
