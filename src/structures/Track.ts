import { Util } from "discord.js";
import { ShoukakuTrack } from "shoukaku";
import { decode } from "@lavalink/encoding";
import DataInput from "../utils/DataInput";

export class DecodeTrack {
    public title: string;
    public author: string;
    public length: number;
    public isStream: boolean;
    public identifier: string;
    public artworkUrl: string | null;
    public uri: string | null;
    public source: string;
    public position: number;

    public constructor(buffer: Uint8Array) {
        const input = new DataInput(buffer);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        input.readInt() >> 30;
        input.readByte();

        this.title = input.readUTF();
        this.author = input.readUTF();
        this.length = Number(input.readLong());
        this.identifier = input.readUTF();
        this.isStream = input.readBoolean();
        this.uri = input.readBoolean() ? input.readUTF() : null;

        const artworkUrl = input.readBoolean() ? input.readUTF() : null;

        this.artworkUrl = artworkUrl;
        this.source = input.readUTF();
        this.position = Number(input.readLong());
    }
}

export class Track {
    public raw!: DecodeTrack | undefined;
    public base64 = this.track.track;
    public info = this.track.info;
    public displayTitle = Util.escapeMarkdown(this.info.title!.length > 45 ? `${this.info.title!.substring(0, 45)}...` : this.info.title!);
    public constructor(public readonly track: ShoukakuTrack, public readonly requester: string) {
        try {
            this.raw = new DecodeTrack(new Uint8Array(Buffer.from(this.base64, "base64")));
        } catch {
            try {
                this.raw = decode(this.base64) as unknown as DecodeTrack;
            } catch {
                throw new Error("Trying to decode invalid base64");
            }
        }
    }

    public get displayThumbnail(): string {
        if (this.raw?.artworkUrl) return this.raw.artworkUrl;
        return `https://i.ytimg.com/vi/${this.info.identifier!}/maxresdefault.jpg`;
    }
}
