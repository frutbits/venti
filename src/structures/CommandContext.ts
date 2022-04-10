/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Args } from "@sapphire/framework";
import { CommandInteraction, InteractionReplyOptions, Message, MessagePayload, MessageOptions, GuildChannel } from "discord.js";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export class CommandContext {
    public author = this.context instanceof CommandInteraction ? this.context.user : this.context.author;
    public channel = this.context.channel;
    public options = this.context instanceof CommandInteraction ? this.context.options : undefined;
    public constructor(public readonly context: CommandInteraction<"cached"> | Message, public args?: Args) {}

    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply?: true): Promise<Message | null>;
    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply?: false): Promise<null>;
    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply = false): Promise<Message | null> {
        if (this.context instanceof CommandInteraction) {
            const interaction = this.context as CommandInteraction;
            if (interaction.deferred && !interaction.replied) {
                return interaction.editReply(options as InteractionReplyOptions) as Promise<Message | null>;
            } else if (interaction.replied) {
                return interaction.followUp(typeof options === "string"
                    ? { content: options, ephemeral: interaction.ephemeral ?? false } as InteractionReplyOptions
                    : { ...options, ephemeral: interaction.ephemeral ?? false } as InteractionReplyOptions) as Promise<Message | null>;
            }
            return interaction.reply(typeof options === "string"
                ? { content: options, fetchReply } as InteractionReplyOptions
                : { ...options, fetchReply } as InteractionReplyOptions) as unknown as Promise<Message | null>;
        }

        if ((options as MessageOptions).embeds && !(this.context.channel as GuildChannel).permissionsFor(this.context.guild!.me!).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"])) return null;

        return this.context.channel.send(options);
    }
}
