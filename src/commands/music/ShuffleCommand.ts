import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, Command, RegisterBehavior } from "@sapphire/framework";
import { CommandInteraction, Message } from "discord.js";
import { devGuilds, isDev } from "../../config";
import { CommandContext } from "../../structures/CommandContext";
import { Util } from "../../utils/Util";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "shuffle",
    description: "Shuffle current queue",
    preconditions: ["isPlayerPlaying", "memberInVoice", "memberVoiceJoinable", "memberInSameVoice"],
    chatInputCommand: {
        register: true
    },
    requiredClientPermissions: ["EMBED_LINKS"]
})
export class ShuffleCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        }, {
            registerCommandIfMissing: true,
            guildIds: isDev ? devGuilds : [],
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite
        });
    }

    public async chatInputRun(interaction: CommandInteraction<"cached">): Promise<any> {
        return this.run(new CommandContext(interaction));
    }

    public messageRun(message: Message, args: Args): Promise<any> {
        return this.run(new CommandContext(message, args));
    }

    public async run(ctx: CommandContext): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(ctx.context.guildId!);
        if (dispatcher?.embedPlayer?.textChannel?.id === ctx.context.channelId) ctx.isInsideRequesterChannel = true;
        dispatcher?.queue.shuffle();
        return ctx.send({
            embeds: [
                Util.createEmbed("success", "🔀 **|** Shuffled current queue")
            ]
        });
    }
}
