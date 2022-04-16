import { Collection } from "discord.js";
import shoukaku, { LavalinkSource, ShoukakuSocket } from "shoukaku";
import { lavalink, lavalinkRest } from "../config";
import { DispatcherOptions } from "../typings";
import { Util } from "../utils/Util";
import { Dispatcher } from "./Dispatcher";
import { Venti } from "./Venti";
import got from "got";

const { Shoukaku, Libraries, ShoukakuTrackList } = shoukaku;

export class ShoukakuHandler extends Shoukaku {
    public readonly queue: Collection<string, Dispatcher> = new Collection();
    public constructor(public readonly client: Venti) {
        super(new Libraries.DiscordJS(client), lavalink.servers, lavalink.options);
    }

    public getDispatcher(options: DispatcherOptions): Dispatcher {
        if (!this.client.shoukaku.queue.has(options.guild.id)) {
            this.queue.set(options.guild.id, new Dispatcher(this.client, options));
        }
        return this.client.shoukaku.queue.get(options.guild.id)!;
    }

    public static getProvider(query: string): LavalinkSource | undefined {
        if (Util.isValidURL(query)) return undefined;
        return "youtube";
    }

    public static async restResolve(node: ShoukakuSocket, identifier: string, search?: LavalinkSource): Promise<shoukaku.ShoukakuTrackList | { error: string }> {
        let result;
        try {
            const searchTypes: Record<LavalinkSource, string> = { soundcloud: "scsearch:", youtube: "ytsearch:", youtubemusic: "ytmsearch:" };
            const url = new URL(lavalinkRest.host ?? node.rest.url);
            url.pathname = "/loadtracks";
            const response = await got.get(url.toString(), {
                searchParams: {
                    identifier: `${searchTypes[search!] || ""}${identifier}`
                },
                headers: {
                    // @ts-expect-error ShoukakuRest#auth is private
                    Authorization: lavalinkRest.auth ?? node.rest.auth
                }
            }).json<object>().catch((e: Error) => ({ message: e.message }));
            if ("error" in response) result = response;
            else result = new ShoukakuTrackList(response);
        } catch (error) {
            result = Promise.resolve({
                error: (error as Error).message
            });
        }
        return result;
    }
}
