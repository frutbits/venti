// Sapphire Plugins
import "@sapphire/plugin-logger/register";

import { SapphireClient } from "@sapphire/framework";
import { ClientOptions } from "discord.js";
import { ShoukakuHandler } from "./ShoukakuHandler";

export class Venti extends SapphireClient {
    public readonly shoukaku = new ShoukakuHandler(this);
    public constructor(opt: ClientOptions) {
        super(opt);
    }
}
