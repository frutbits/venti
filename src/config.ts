import { NodeOption } from "shoukaku";

export const devs: string[] = JSON.parse(process.env.CONFIG_DEVS ?? "[]");
export const devGuilds = JSON.parse(process.env.CONFIG_DEV_GUILDS ?? "[]");
export const isDev = process.env.NODE_ENV === "DEVELOPMENT";
export const prefix = process.env.CONFIG_PREFIX!;
export const deleteQueueTimeout = Number(process.env.CONFIG_DELETE_QUEUE_TIMEOUT!) * 1000;
export const lavalinkRest: { host?: string; auth?: string } = JSON.parse(process.env.LAVALINK_REST ?? "{}");
export const lavalink = {
    servers: JSON.parse(process.env.LAVALINK_NODES ?? "[]") as NodeOption[],
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
if (typeof process.env.CONFIG_DELETE_QUEUE_TIMEOUT !== "string" || isNaN(deleteQueueTimeout) || deleteQueueTimeout < 1) throw new Error("CONFIG_DELETE_QUEUE_TIMEOUT must be a number");
if (typeof process.env.NODE_ENV !== "string" || !["DEVELOPMENT", "PRODUCTION"].includes(process.env.NODE_ENV)) throw new Error("NODE_ENV must be a either DEVELOPMENT or PRODUCTION");
if (typeof process.env.LAVALINK_NODES !== "string") throw new Error("LAVALINK_NODES must be an array string (\"[]\")");
if (typeof process.env.LAVALINK_REST !== "string") throw new Error("LAVALINK_REST must be an object string (\"{}\")");

