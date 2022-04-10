import { VoiceState } from "discord.js";
import { ShoukakuPlayer, ShoukakuTrack } from "shoukaku";
import { DispatcherOptions } from "../typings";
import { Track } from "./Track";
import { Venti } from "./Venti";

export class Dispatcher {
    public readonly guild = this.options.guild;
    public readonly textChannel = this.options.textChannel;
    public readonly voiceChannel = this.options.voiceChannel;
    public readonly queue: Track[] = [];
    public player!: ShoukakuPlayer | null;
    public constructor(public readonly client: Venti, public readonly options: DispatcherOptions) {}

    public async connect(): Promise<{ success: boolean; error?: string }> {
        if (this.player) return { success: true };
        const response = await this.client.shoukaku.getNode().joinChannel({
            guildId: this.guild.id,
            shardId: this.guild.shardId,
            channelId: this.voiceChannel.id,
            deaf: true
        }).catch((e: Error) => ({ error: e.message }));
        if ("error" in response) return { success: false, error: response.error };
        this.player = response;
        return { success: true };
    }

    public addTracks(data: { track: ShoukakuTrack; requester: string }[]): boolean[] {
        const added: boolean[] = [];
        for (const { track, requester } of data) {
            if (this.queue.some(x => x.info.identifier === track.info.identifier)) {
                added.push(false);
                continue;
            }
            Object.assign(track, { requester });
            this.queue.push(track as Track);
            added.push(true);
        }
        return added;
    }

    public destroy(): void {
        if (this.player) this.player.connection.disconnect();
        this.client.shoukaku.queue.delete(this.guild.id);
    }

    public get listeners(): VoiceState[] {
        if (this.guild.me?.voice.channelId && this.player) {
            const states = this.guild.voiceStates.cache.filter(x => x.channelId === this.player?.connection.channelId && x.id !== this.client.user!.id);
            return Array.from(states.values());
        }
        return [];
    }
}
