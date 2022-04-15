import { Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import { Dispatcher, LoopType } from "../structures/Dispatcher";
import { Util } from "./Util";
import get from "got";
import { Images } from "../constants";
import { prefix as defaultPrefix } from "../config";

export class EmbedPlayer {
    public readonly client = this.dispatcher.client;
    public readonly guild = this.dispatcher.guild;
    public message!: Message | undefined;
    public textChannel!: TextChannel | undefined;
    public constructor(public dispatcher: Dispatcher) {}

    public async fetch(force = false): Promise<EmbedPlayer | undefined> {
        if (this.textChannel && this.message && !force) return this;
        const data = await this.client.databases.guild.fetchGuildRequester(this.guild.id);
        const requester = await EmbedPlayer.resolveRequesterChannel(this.guild, data);
        if (!requester.channel) return undefined;
        this.textChannel = requester.channel;
        if (requester.message) {
            this.message = requester.message;
        } else {
            this.textChannel = undefined;
            this.message = undefined;
        }
        return this;
    }

    public async update(): Promise<any> {
        const loopModes = {
            [LoopType.ONE]: "track",
            [LoopType.ALL]: "queue",
            [LoopType.NONE]: "off"
        };
        if (!this.textChannel || !this.message) return;
        if (this.message.editable && this.dispatcher.player) {
            if (this.dispatcher.queue.length) {
                const list = Util.chunk(this.dispatcher.queue.queued.map((x, i) => `${++i}. ${x.info.author!} - ${x.info.title!} [${x.info.isStream ? "LIVE" : Util.readableTime(x.info.length!)}] ~ <@${x.requester}>`), 10);
                const currentSong = this.dispatcher.queue[0];
                const image = await get(currentSong.displayThumbnail).then(() => currentSong.displayThumbnail).catch(() => Images.DEFAULT_BANNER);
                const embed = Util.createEmbed("info")
                    .setTitle(`**${currentSong.info.title!}**`)
                    .setURL(currentSong.info.uri!)
                    .setDescription(`Requested by: <@${currentSong.requester}>`)
                    .setImage(image)
                    .setFooter({ text: `${list.length} songs in queue | Volume: ${this.dispatcher.player.filters.volume * 100}% ${this.dispatcher.loopState === LoopType.NONE ? "" : `| Loop: ${loopModes[this.dispatcher.loopState]}`} ${this.dispatcher.player.paused ? "| Song paused" : ""}` });
                await this.message.edit({
                    allowedMentions: { parse: [] },
                    embeds: [embed],
                    content: `**__Queue list:__**${list.length > 1 ? `\n\nAnd **${this.dispatcher.queue.length - list[0].length}** more...` : ""}\n${list.length ? list[0].reverse().join("\n") : "Join a voice channel and queue songs by name or url in here."}`
                });
            } else {
                const data = await this.client.prisma.guilds.findFirst({
                    select: {
                        prefix: true
                    },
                    where: {
                        id: this.guild.id
                    }
                });
                await this.message.edit({
                    allowedMentions: { parse: [] },
                    embeds: [EmbedPlayer.generateDefaultEmbed(this.guild, data?.prefix ?? defaultPrefix)],
                    content: " "
                });
            }
        }
    }

    public static async resolveRequesterChannel(
        guild: Guild, data: { channel: string | null | undefined; message: string | null | undefined }
    ): Promise<{ channel: TextChannel | undefined; message: Message | undefined }> {
        if (!data.channel || !data.message) return { channel: undefined, message: undefined };
        const channel = await guild.channels.fetch(data.channel).catch(() => undefined);
        if (!channel?.isText()) {
            await guild.client.prisma.guilds.update({
                where: { id: guild.id },
                data: { requester_channel: null, requester_message: null }
            });
            return { channel: undefined, message: undefined };
        }
        const message = await channel.messages.fetch(data.message).catch(() => undefined);
        if (!message) {
            await guild.client.prisma.guilds.update({
                where: { id: guild.id },
                data: { requester_channel: null, requester_message: null }
            });
            return { channel: undefined, message: undefined };
        }
        return { channel: channel as TextChannel, message };
    }

    public static generateDefaultEmbed(guild: Guild, prefix: string): MessageEmbed {
        return Util.createEmbed("info")
            .setAuthor({ name: "No song playing currently", iconURL: guild.iconURL({ dynamic: true, size: 4096 })! })
            .setImage(Images.DEFAULT_BANNER)
            .setDescription("Join a voice channel and queue songs by name or url in here.")
            .setFooter({ text: `Prefix for this server is: ${prefix}` });
    }
}
