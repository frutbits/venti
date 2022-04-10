// Sapphire Plugins
import "@sapphire/plugin-logger/register";

import { SapphireClient } from "@sapphire/framework";
import { ClientOptions } from "discord.js";
import { ShoukakuHandler } from "./ShoukakuHandler";
import * as constants from "../constants";

export class Venti extends SapphireClient {
    public readonly shoukaku = new ShoukakuHandler(this);
    public readonly constants = constants;
    public constructor(opt: ClientOptions) {
        super(opt);
    }
}
