/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Args } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands";
import { CommandInteraction, InteractionReplyOptions, Message, MessagePayload, MessageOptions, GuildChannel, ButtonInteraction, SelectMenuInteraction, InteractionType, Interaction } from "discord.js";
import { InteractionTypes, MessageComponentTypes } from "../typings/enum";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export class CommandContext {
    public author = this.isInteraction() ? (this.context as Interaction).user : (this.context as Message).author;
    public channel = this.context.channel;
    public options = this.context instanceof CommandInteraction ? this.context.options : undefined;
    public isInsideRequesterChannel = false;
    public constructor(public readonly context: CommandInteraction<"cached"> | Message, public args?: Args) {}

    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply?: true): Promise<Message | null>;
    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply?: false): Promise<null>;
    public async send(options: InteractionReplyOptions | MessageOptions | MessagePayload, fetchReply = false): Promise<Message | null> {
        if (this.context instanceof Interaction) {
            const interaction = this.context as CommandInteraction;
            if (interaction.deferred && !interaction.replied) {
                return interaction.editReply(options as InteractionReplyOptions) as Promise<Message | null>;
            } else if (interaction.replied) {
                return interaction.followUp(typeof options === "string"
                    ? { content: options, ephemeral: interaction.ephemeral ?? false } as InteractionReplyOptions
                    : { ...options, ephemeral: interaction.ephemeral ?? false } as InteractionReplyOptions) as Promise<Message | null>;
            }
            if (this.isInsideRequesterChannel) {
                // @ts-expect-error-next-line
                if (typeof options !== "string") options.ephemeral = true;
            }
            const msg = await interaction.reply(typeof options === "string"
                ? { content: options, fetchReply } as InteractionReplyOptions
                : { ...options, fetchReply } as InteractionReplyOptions) as unknown as Message | null;
            return msg;
        }

        if ((options as MessageOptions).embeds && !(this.context.channel as GuildChannel).permissionsFor(this.context.guild!.me!).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"])) return null;

        const msg = await send(this.context, options as MessageOptions);
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
        return InteractionTypes[this.context.type as InteractionType] === InteractionTypes.APPLICATION_COMMAND && typeof (this.context as unknown as { targetId: string | undefined }).targetId === "undefined";
    }

    public isMessageCommand(): boolean {
        return this.context instanceof Message;
    }

    public isContextMenu(): boolean {
        // @ts-expect-error-next-line
        return InteractionTypes[this.context.type] === InteractionTypes.APPLICATION_COMMAND && typeof (this.context as unknown as { targetId: string | undefined }).targetId !== "undefined";
    }

    public isMessageComponent(): boolean {
        // @ts-expect-error-next-line
        return InteractionTypes[this.context.type] === InteractionTypes.MESSAGE_COMPONENT;
    }

    public isButton(): boolean {
        return (
            // @ts-expect-error-next-line
            InteractionTypes[this.context.type] === InteractionTypes.MESSAGE_COMPONENT &&
            MessageComponentTypes[(this.context as unknown as ButtonInteraction).componentType] === MessageComponentTypes.BUTTON
        );
    }

    public isSelectMenu(): boolean {
        return (
            // @ts-expect-error-next-line
            InteractionTypes[this.context.type] === InteractionTypes.MESSAGE_COMPONENT &&
            MessageComponentTypes[(this.context as unknown as SelectMenuInteraction).componentType] === MessageComponentTypes.SELECT_MENU
        );
    }
}
