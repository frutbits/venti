/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Events, Listener, UserError, ChatInputCommandDeniedPayload, Identifiers } from "@sapphire/framework";
import { MessageOptions, PermissionString } from "discord.js";
import { Util } from "../../../utils/Util";

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
    // eslint-disable-next-line class-methods-use-this
    public override run({ context, message: content, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload): any {
        if (Reflect.get(Object(context), "silent")) return;
        const payload: MessageOptions = {
            embeds: [
                Util.createEmbed("error", content, true)
            ]
        };
        const cooldownRemaining = Reflect.get(Object(context), "remaining") as number | undefined;
        if (cooldownRemaining && identifier === Identifiers.PreconditionCooldown) {
            payload.embeds = [
                Util.createEmbed("error", `**${interaction.user.username}**, please wait **${(cooldownRemaining / 1000).toFixed(1)}** cooldown time.`, true)
            ];
        }
        const missingPerms = Reflect.get(Object(context), "missing") as PermissionString[] | undefined;
        if (missingPerms && [Identifiers.PreconditionClientPermissions, Identifiers.PreconditionUserPermissions].includes(identifier as Identifiers)) {
            payload.embeds = [
                Util.createEmbed("error", `${identifier === Identifiers.PreconditionClientPermissions ? "I am" : "You are"} missing the following permissions to run this command:\n\`\`\`diff\n${missingPerms.map(x => `- ${Util.readablePermissions[x]}`).join("\n")}\`\`\``, true)
            ];
        }
        return interaction.reply({
            ...payload,
            allowedMentions: { users: [interaction.user.id], roles: [] },
            ephemeral: true
        });
    }
}
