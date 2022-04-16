import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, ChatInputCommandContext, Listener } from "@sapphire/framework";
import { CommandInteraction, Interaction } from "discord.js";
import { prefix } from "../../config";

@ApplyOptions<Listener.Options>({
    event: "interactionCreate"
})
export class InteractionCreateListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, options);
    }

    public async run(interaction: Interaction): Promise<any> {
        if (interaction.isButton() && interaction.inGuild() && interaction.customId.startsWith("player_")) {
            const id = interaction.customId.split("_");
            if (!id[1]) return undefined;
            const command = this.container.stores.get("commands").get(id[1]) as ChatInputCommand | undefined;
            if (!command) return;
            const preconditionsResult = await command.preconditions.chatInputRun(interaction as unknown as CommandInteraction, command, { command });
            const context: ChatInputCommandContext = {
                commandName: command.name,
                commandId: interaction.customId,
                commandPrefix: prefix,
                prefix
            };
            if (!preconditionsResult.success) {
                return undefined;
            }
            await interaction.deferUpdate();
            return command.chatInputRun(interaction as unknown as CommandInteraction, context);
        }
    }
}
