import { Snowflake, VoiceState } from "discord.js";
import { LavalinkTrack } from "lavalink-api-types";
import { Player, TrackEndEvent, TrackExceptionEvent } from "shoukaku";
import { DispatcherOptions } from "../typings";
import { EmbedPlayer } from "../utils/EmbedPlayer";
import { Util } from "../utils/Util";
import { Track } from "./Track";
import { Venti } from "./Venti";

const nonEnum = { enumerable: false };

export enum LoopType {
    NONE = 0,
    ALL = 1,
    ONE = 2
}

export class Queue extends Array<Track> {
    public previousTrack!: Track;
    public get currentTrack(): Track | undefined {
        return this[0];
    }

    public get queueSize(): number {
        return Math.max(0, this.length - 1);
    }

    public get queued(): Track[] {
        return this.filter((x, i) => i !== 0);
    }

    public shuffle(): void {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}

export class Dispatcher {
    public readonly guild = this.options.guild;
    public readonly textChannel = this.options.textChannel;
    public readonly voiceChannel = this.options.voiceChannel;
    public readonly queue = new Queue();
    public timeout: NodeJS.Timeout | null = null;
    public votes: string[] = [];
    public loopState: LoopType = LoopType.NONE;
    public player!: Player | null;
    public embedPlayer: EmbedPlayer | undefined;
    private _lastMusicMessageID: Snowflake | null = null;
    private _lastExceptionMessageID: Snowflake | null = null;
    private _lastVoiceStateUpdateMessageID: Snowflake | null = null;

    public constructor(public readonly client: Venti, public readonly options: DispatcherOptions) {
        Object.defineProperties(this, {
            _lastMusicMessageID: nonEnum,
            _lastVoiceStateUpdateMessageID: nonEnum
        });
    }

    public async connect(): Promise<{ success: boolean; error?: string }> {
        if (this.player) return { success: true };
        const response = await this.client.shoukaku.getNode()!.joinChannel({
            guildId: this.guild.id,
            shardId: this.guild.shardId,
            channelId: this.voiceChannel.id,
            deaf: true
        }).catch((e: Error) => ({ error: e.message }));
        if ("error" in response) return { success: false, error: response.error };
        this.embedPlayer = new EmbedPlayer(this);
        await this.embedPlayer.fetch();
        this.player = response;
        this.handleEvent(this.player);
        return { success: true };
    }

    public async addTracks(
        data: { track: LavalinkTrack; requester: string }[]
    ): Promise<{ duplicate: string[]; overload: string[]; success: string[]; queueLimit: number | null }> {
        const settings = await this.client.databases.guild.get(this.guild.id, {
            select: {
                allow_duplicate: true,
                max_queue: true
            }
        });
        const added: { duplicate: string[]; overload: string[]; success: string[]; queueLimit: number | null } = {
            duplicate: [],
            overload: [],
            success: [],
            queueLimit: settings.max_queue
        };
        for (const { track, requester } of data) {
            if (!settings.allow_duplicate && this.queue.some(x => x.info.identifier === track.info.identifier)) {
                added.duplicate.push(track.track);
                continue;
            }
            if (settings.max_queue && !isNaN(settings.max_queue) && this.queue.length >= settings.max_queue) {
                added.overload.push(track.track);
                continue;
            }
            this.queue.push(new Track(track, requester));
            added.success.push(track.track);
        }
        return added;
    }

    public destroy(): void {
        if (this.player) this.player.connection.disconnect();
        this.oldMusicMessage = null;
        this.oldVoiceStateUpdateMessage = null;
        Object.assign(this, { queue: [] });
        void this.embedPlayer?.update();
        this.client.shoukaku.queue.delete(this.guild.id);
    }

    public handleEvent(player: Player): void {
        player.on("start", async () => {
            void this.embedPlayer?.update();
            if (!this.embedPlayer?.message) {
                this.oldMusicMessage = await this.textChannel.send({
                    embeds: [
                        Util.createEmbed("info", `Started playing: \`${this.queue[0].displayTitle}\``)
                    ]
                }).then(x => x.id);
            }
        });
        player.on("end", async (data: TrackEndEvent) => {
            if (data.reason === "REPLACED") return;
            this.queue.previousTrack = this.queue[0];
            this.queue.shift();
            if (["LOAD_FAILED", "CLEAN_UP"].includes(data.reason)) {
                if (this.queue.length) return player.playTrack({ track: this.queue[0].base64 });
            }
            if (this.loopState === LoopType.ALL) this.queue.push(this.queue.previousTrack);
            if (this.loopState === LoopType.ONE) this.queue.unshift(this.queue.previousTrack);
            void this.embedPlayer?.update();
            if (this.queue.length) return player.playTrack({ track: this.queue[0].base64 });
            if (!this.embedPlayer?.message) {
                await this.textChannel.send({
                    embeds: [
                        Util.createEmbed("info", "We've run out of songs! Better queue up some more tunes.")
                            .setTitle("**Queue Concluded**")
                    ]
                }).then(x => x.id);
            }
            return this.destroy();
        });
        player.on("exception", async (data: TrackExceptionEvent) => {
            this.oldExceptionMessage = await this.textChannel.send({
                embeds: [
                    Util.createEmbed("error", `There is an exception while trying to play this track:\n\`\`\`java\n${data.exception!.message}\`\`\``, true)
                ]
            }).then(x => x.id);
            if (this.embedPlayer?.textChannel) {
                setTimeout(() => this.oldExceptionMessage = null, 5000);
            }
        });
    }

    public get listeners(): VoiceState[] {
        if (this.guild.me?.voice.channelId && this.player) {
            const states = this.guild.voiceStates.cache.filter(x => x.channelId === this.player?.connection.channelId && x.id !== this.client.user!.id);
            return Array.from(states.values());
        }
        return [];
    }

    public get oldMusicMessage(): Snowflake | null {
        return this._lastMusicMessageID;
    }

    public set oldMusicMessage(id: Snowflake | null) {
        if (this._lastMusicMessageID !== null) {
            this.textChannel.messages.fetch(this._lastMusicMessageID)
                .then(m => m.delete())
                .catch(e => this.client.logger.error(e));
        }
        this._lastMusicMessageID = id;
    }

    public get oldVoiceStateUpdateMessage(): Snowflake | null {
        return this._lastVoiceStateUpdateMessageID;
    }

    public set oldVoiceStateUpdateMessage(id: Snowflake | null) {
        if (this._lastVoiceStateUpdateMessageID !== null) {
            this.textChannel.messages.fetch(this._lastVoiceStateUpdateMessageID)
                .then(m => m.delete())
                .catch(e => this.client.logger.error(e));
        }
        this._lastVoiceStateUpdateMessageID = id;
    }

    public get oldExceptionMessage(): Snowflake | null {
        return this._lastExceptionMessageID;
    }

    public set oldExceptionMessage(id: Snowflake | null) {
        if (this._lastExceptionMessageID !== null) {
            this.textChannel.messages.fetch(this._lastExceptionMessageID)
                .then(m => m.delete())
                .catch(e => this.client.logger.error(e));
        }
        this._lastExceptionMessageID = id;
    }
}
