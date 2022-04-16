/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Args } from "@sapphire/framework";
import { CommandInteraction, InteractionReplyOptions, Message, MessagePayload, MessageOptions, GuildChannel, InteractionType, ButtonInteraction, SelectMenuInteraction } from "discord.js";
import { InteractionTypes, MessageComponentTypes } from "discord.js/typings/enums";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export class CommandContext {
    public author = this.context instanceof CommandInteraction ? this.context.user : this.context.author;
    public channel = this.context.channel;
    public options = this.context instanceof CommandInteraction ? this.context.options : undefined;
    public isInsideRequesterChannel = false;
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

        const msg = await this.context.channel.send(options);
        if (this.isInsideRequesterChannel) {
            setTimeout(async () => {
                if (msg.deletable) await msg.delete();
            }, 5000);
        }
        return msg;
    }

    public isInteraction(): boolean {
        return this.isCommand() || this.isContextMenu() || this.isMessageComponent() || this.isButton() || this.isSelectMenu();
    }

    public isCommand(): boolean {
        // @ts-expect-error-next-line
        return InteractionTypes[this.context.type as InteractionType] === InteractionTypes.APPLICATION_COMMAND && typeof (this.context as { targetId: string | undefined }).targetId === "undefined";
    }

    public isMessageCommand(): boolean {
        return this.context instanceof Message;
    }

    public isContextMenu(): boolean {
        // @ts-expect-error-next-line
        return InteractionTypes[this.context.type as InteractionType] === InteractionTypes.APPLICATION_COMMAND && typeof (this.context as { targetId: string | undefined }).targetId !== "undefined";
    }

    public isMessageComponent(): boolean {
        // @ts-expect-error-next-line
        return InteractionTypes[this.context.type as InteractionType] === InteractionTypes.MESSAGE_COMPONENT;
    }

    public isButton(): boolean {
        return (
            // @ts-expect-error-next-line
            InteractionTypes[this.context.type as InteractionType] === InteractionTypes.MESSAGE_COMPONENT &&
            // @ts-expect-error-next-line
            MessageComponentTypes[(this.context as unknown as ButtonInteraction).componentType] === MessageComponentTypes.BUTTON
        );
    }

    public isSelectMenu(): boolean {
        return (
            // @ts-expect-error-next-line
            InteractionTypes[this.context.type as InteractionType] === InteractionTypes.MESSAGE_COMPONENT &&
            // @ts-expect-error-next-line
            MessageComponentTypes[(this.context as SelectMenuInteraction).componentType] === MessageComponentTypes.SELECT_MENU
        );
    }
}
