/* eslint-disable @typescript-eslint/no-base-to-string */
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, Command, RegisterBehavior } from "@sapphire/framework";
import { CommandInteraction, Message, TextChannel, VoiceChannel, Util as DiscordJSUtil } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { devGuilds } from "../../config";
import { CommandContext } from "../../structures/CommandContext";
import { ShoukakuHandler } from "../../structures/ShoukakuHandler";
import { Track } from "../../structures/Track";
import { EmbedPlayer } from "../../utils/EmbedPlayer";
import { Util } from "../../utils/Util";

@ApplyOptions<Command.Options>({
    aliases: [],
    name: "play",
    description: "Add a music to the queue",
    preconditions: ["isNodeAvailable", "memberInVoice", "memberVoiceJoinable", "memberInSameVoice"],
    chatInputCommand: {
        register: true
    },
    requiredClientPermissions: ["EMBED_LINKS"]
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
        }, {
            registerCommandIfMissing: true,
            guildIds: devGuilds,
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
        const data = await this.container.client.databases.guild.fetchGuildRequester(ctx.context.guildId!);
        let requester: Awaited<ReturnType<typeof EmbedPlayer["resolveRequesterChannel"]>> | undefined;
        if (data.channel && data.message) {
            requester = await EmbedPlayer.resolveRequesterChannel(ctx.context.guild!, data);
            if (requester.channel?.id !== ctx.context.channelId) {
                return ctx.send({
                    embeds: [
                        Util.createEmbed("error", `This command is restricted to ${requester.channel!.toString()}`)
                    ]
                });
            }
            ctx.isInsideRequesterChannel = true;
        }
        if (ctx.context instanceof CommandInteraction) await ctx.context.deferReply({ ephemeral: requester?.channel?.id === ctx.context.channel?.id });
        const argsQuery = await ctx.args?.restResult("string");
        if (!argsQuery?.success && !ctx.options) {
            return ctx.send({
                embeds: [
                    Util.createEmbed("error", "Please provide a valid query", true)
                ]
            });
        }
        const query = argsQuery?.value ?? ctx.options?.getString("query", true);
        const result = await this.container.client.shoukaku.getNode().rest.resolve(query!, ShoukakuHandler.getProvider(query!));
        if (result.type === "NO_MATCHES" || !result.tracks.length) {
            return ctx.send({
                embeds: [
                    Util.createEmbed("error", "Couldn't obtain any result matching the query", true)
                ]
            });
        }
        const dispatcher = this.container.client.shoukaku.getDispatcher({
            guild: ctx.context.guild!,
            member: ctx.context.member!,
            textChannel: ctx.context.channel as TextChannel,
            voiceChannel: ctx.context.member!.voice.channel as VoiceChannel
        });
        if (!dispatcher.player) {
            const response = await dispatcher.connect();
            if (response.error) {
                return ctx.send({
                    embeds: [
                        Util.createEmbed("error", `Failed when trying to join your channel: \`${response.error}\``, true)
                    ]
                });
            }
        }
        const toAdd = result.tracks.map(x => ({
            track: x,
            requester: ctx.author.id
        }));
        const added = await dispatcher.addTracks(
            result.type === "PLAYLIST" ? toAdd : [toAdd[0]]
        );
        if (!dispatcher.player?.track && added.success.length) {
            dispatcher.player?.playTrack(dispatcher.queue[0].base64);
        }
        await dispatcher.embedPlayer?.update();
        if (added.success.length) {
            return ctx.send({
                embeds: [
                    Util.createEmbed(
                        "success",
                        `Added ${result.type === "PLAYLIST" ? `**${result.playlistName ?? "Unknown Playlist"}** (${result.tracks.length} tracks)` : `\`${DiscordJSUtil.escapeMarkdown(toAdd[0].track.info.title!)}\``} to the queue`,
                        true
                    ).setThumbnail(result.type === "PLAYLIST" ? " " : new Track(toAdd[0].track, ctx.author.id).displayThumbnail)
                ]
            });
        }
        if (added.overload.length || added.duplicate.length) {
            return ctx.send({
                embeds: [
                    Util.createEmbed(
                        "error",
                        `Over ${added.duplicate.length ? `\`${added.duplicate.length}\` duplicate tracks are skipped` : ""} ${added.overload.length ? `${added.duplicate.length ? "and" : ""} over \`${added.overload.length}\` tracks are skipped because exceeds max queue limit for this server (${added.queueLimit!} tracks)` : ""}`
                    )
                ]
            });
        }
    }
}
