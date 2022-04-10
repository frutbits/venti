import { Collection } from "discord.js";
import shoukaku, { LavalinkSource } from "shoukaku";
import { lavalink } from "../config";
import { DispatcherOptions } from "../typings";
import { Util } from "../util/Util";
import { Dispatcher } from "./Dispatcher";
import { Venti } from "./Venti";

const { Shoukaku, Libraries } = shoukaku;

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
}
