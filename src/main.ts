import { BucketScope } from "@sapphire/framework";
import "dotenv/config";
import "@sapphire/plugin-editable-commands/register";
import process from "node:process";
import { devs, prefix } from "./config.js";
import { Venti } from "./structures/Venti.js";

const client = new Venti({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILD_MEMBERS"],
    loadMessageCommandListeners: true,
    fetchPrefix: () => prefix,
    defaultCooldown: {
        delay: 10_000,
        filteredUsers: devs,
        limit: 2,
        scope: BucketScope.Channel
    }
});

process.on("unhandledRejection", e => {
    client.logger.error(e);
});

process.on("uncaughtException", e => {
    client.logger.fatal(e);
    process.exit(1);
});

client.login(process.env.DISCORD_TOKEN).catch(e => client.logger.error(e));
