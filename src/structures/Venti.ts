// Sapphire Plugins
import "@sapphire/plugin-logger/register";

import { SapphireClient } from "@sapphire/framework";
import { ClientOptions } from "discord.js";
import { ShoukakuHandler } from "./ShoukakuHandler";
import * as constants from "../constants";
import { Util } from "../utils/Util";

export class Venti extends SapphireClient {
    public readonly shoukaku = new ShoukakuHandler(this);
    public readonly util = new Util(this);
    public readonly constants = constants;
    public constructor(opt: ClientOptions) {
        super(opt);
    }
}
