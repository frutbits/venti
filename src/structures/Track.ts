import { ShoukakuTrack } from "shoukaku";

export class Track extends ShoukakuTrack {
    public constructor(raw: object, public readonly requester: string) {
        super(raw);
    }
}
