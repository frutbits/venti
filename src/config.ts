import { NodeOptions } from "shoukaku";

export const devs: string[] = JSON.parse(process.env.DEVS ?? "[]");
export const devGuilds = JSON.parse(process.env.DEV_GUILDS ?? "[]");
export const prefix = ",";
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
