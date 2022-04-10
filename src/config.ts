import { NodeOptions } from "shoukaku";

export const devs: string[] = JSON.parse(process.env.CONFIG_DEVS ?? "[]");
export const devGuilds = JSON.parse(process.env.CONFIG_DEV_GUILDS ?? "[]");
export const prefix = process.env.CONFIG_PREFIX!;
export const lavalink = {
    servers: JSON.parse(process.env.LAVALINK_NODES ?? "[]") as NodeOptions[],
    options: {
        moveOnDisconnect: false,
        reconnectTries: 3,
        reconnectInterval: 60_000,
        restTimeout: 10000,
        resumable: true,
        resumableTimeout: 30
    }
};

if (typeof process.env.CONFIG_PREFIX !== "string") throw new Error("CONFIG_PREFIX must be a string");
