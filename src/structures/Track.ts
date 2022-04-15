import { ShoukakuTrack } from "shoukaku";

export class Track {
    public thumbnail!: string;
    public base64 = this.track.track;
    public info = this.track.info;
    public constructor(public readonly track: ShoukakuTrack, public readonly requester: string) {}

    public get displayThumbnail(): string {
        if (this.thumbnail) return this.thumbnail;
        return `https://i3.ytimg.com/vi/${this.info.identifier!}/maxresdefault.jpg`;
    }
}
