import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, RegisterBehavior } from "@sapphire/framework";
import { CommandInteraction, TextChannel, VoiceChannel } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { devGuilds } from "../../config";
import { ShoukakuHandler } from "../../structures/ShoukakuHandler";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "play",
    description: "Add a music to the queue",
    preconditions: ["isNodeAvailable", "memberInVoice", "memberVoiceJoinable", "memberInSameVoice"],
    chatInputCommand: {
        register: true,
        guildIds: devGuilds,
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite
    }
})
export class PlayCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: "query",
                    type: ApplicationCommandOptionTypes.STRING,
                    description: "Music to play (the title or supported link)",
                    required: true
                }
            ]
        });
    }

    public async chatInputRun(interaction: CommandInteraction<"cached">): Promise<any> {
        if (!interaction.deferred) await interaction.deferReply();
        const query = interaction.options.getString("query", true);
        const result = await this.container.client.shoukaku.getNode().rest.resolve(query, ShoukakuHandler.getProvider(query));
        if (result.type === "NO_MATCHES" || !result.tracks.length) {
            return interaction.editReply({
                content: "Couldn't obtain any result matching the query"
            });
        }
        const dispatcher = this.container.client.shoukaku.getDispatcher({
            guild: interaction.guild,
            member: interaction.member,
            textChannel: interaction.channel as TextChannel,
            voiceChannel: interaction.member.voice.channel as VoiceChannel
        });
        if (!dispatcher.player) {
            const response = await dispatcher.connect();
            if (response.error) {
                return interaction.editReply({
                    content: `Failed when trying to join your channel: \`${response.error}\``
                });
            }
        }
        dispatcher.addTracks([
            {
                track: result.tracks[0],
                requester: interaction.user.id
            }
        ]);
        if (!dispatcher.player?.track) {
            dispatcher.player?.playTrack(dispatcher.queue[0]);
        }
        return interaction.editReply({
            content: `Added \`${result.tracks[0].info.title!}\` to the queue`
        });
    }
}
