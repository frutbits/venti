import { Events, Listener, UserError, ChatInputCommandDeniedPayload } from "@sapphire/framework";

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
    // eslint-disable-next-line class-methods-use-this
    public override run({ context, message: content }: UserError, { interaction }: ChatInputCommandDeniedPayload): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (Reflect.get(Object(context), "silent")) return;

        return interaction.reply({
            content,
            allowedMentions: { users: [interaction.user.id], roles: [] },
            ephemeral: true
        });
    }
}
