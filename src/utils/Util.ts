import { ColorResolvable, MessageEmbed, PermissionString } from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { embedInfoColor, Emojis } from "../constants";
import { Venti } from "../structures/Venti";

type hexColorsType = "error" | "info" | "success" | "warn";
const hexColors: Record<hexColorsType, string> = {
    error: "RED",
    info: embedInfoColor,
    success: "GREEN",
    warn: "YELLOW"
};

export class Util {
    public constructor(public readonly client: Venti) {}

    public static formatDate(dateFormat: Intl.DateTimeFormat, date: Date | number = new Date()): string {
        const data = dateFormat.formatToParts(date);
        return "<year>-<month>-<day>"
            .replace(/<year>/g, data.find(d => d.type === "year")!.value)
            .replace(/<month>/g, data.find(d => d.type === "month")!.value)
            .replace(/<day>/g, data.find(d => d.type === "day")!.value);
    }

    public static formatMS(ms: number): string {
        if (isNaN(ms)) throw new Error("value is not a number.");
        return prettyMilliseconds(ms, {
            verbose: true,
            compact: false,
            secondsDecimalDigits: 0
        });
    }

    public static createEmbed(type: hexColorsType, message?: string, emoji = false): MessageEmbed {
        const embed = new MessageEmbed()
            .setColor(hexColors[type] as ColorResolvable);

        if (message) embed.setDescription(message);
        if (type === "error" && emoji) embed.setDescription(`${Emojis.NO} **|** ${message!}`);
        if (type === "success" && emoji) embed.setDescription(`${Emojis.YES} **|** ${message!}`);
        return embed;
    }

    public static readableTime(duration: number): string {
        const SECOND = 1000;
        const MINUTE = SECOND * 60;
        const HOUR = MINUTE * 60;
        const seconds = Math.floor(duration / SECOND) % 60;
        if (duration < MINUTE) return `00:${seconds.toString().padStart(2, "0")}`;
        const minutes = Math.floor(duration / MINUTE) % 60;
        let output = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        if (duration >= HOUR) {
            const hours = Math.floor(duration / HOUR);
            output = `${hours.toString().padStart(2, "0")}:${output}`;
        }
        return output;
    }

    public static chunk<T>(arr: T[], len: number): T[][];
    public static chunk(arr: string, len: number): string[];
    public static chunk(...args: any[]): any[] {
        const [arr, len] = args as [any, number];
        const rest: (typeof arr)[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        for (let i = 0; i < arr.length; i += len) { rest.push(arr.slice(i, i + len)); }
        return rest;
    }

    public static isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    public static readonly readablePermissions: Record<PermissionString, string> = {
        ADD_REACTIONS: "Add Reactions",
        ADMINISTRATOR: "Administrator",
        ATTACH_FILES: "Attach Files",
        BAN_MEMBERS: "Ban Members",
        CHANGE_NICKNAME: "Change Nickname",
        CONNECT: "Connect",
        CREATE_INSTANT_INVITE: "Create Instant Invite",
        CREATE_PRIVATE_THREADS: "Create Private Threads",
        CREATE_PUBLIC_THREADS: "Create Public Threads",
        DEAFEN_MEMBERS: "Deafen Members",
        EMBED_LINKS: "Embed Links",
        KICK_MEMBERS: "Kick Members",
        MANAGE_CHANNELS: "Manage Channels",
        MANAGE_EMOJIS_AND_STICKERS: "Manage Emojis and Stickers",
        MANAGE_EVENTS: "Manage Events",
        MANAGE_GUILD: "Manage Server",
        MANAGE_MESSAGES: "Manage Messages",
        MANAGE_NICKNAMES: "Manage Nicknames",
        MANAGE_ROLES: "Manage Roles",
        MANAGE_THREADS: "Manage Threads",
        MANAGE_WEBHOOKS: "Manage Webhooks",
        MENTION_EVERYONE: "Mention Everyone",
        MODERATE_MEMBERS: "Moderate Members",
        MOVE_MEMBERS: "Move Members",
        MUTE_MEMBERS: "Mute Members",
        PRIORITY_SPEAKER: "Priority Speaker",
        READ_MESSAGE_HISTORY: "Read Message History",
        REQUEST_TO_SPEAK: "Request to Speak",
        SEND_MESSAGES_IN_THREADS: "Send Messages in Threads",
        SEND_MESSAGES: "Send Messages",
        SEND_TTS_MESSAGES: "Send TTS Messages",
        SPEAK: "Speak",
        START_EMBEDDED_ACTIVITIES: "Start Activities",
        STREAM: "Stream",
        USE_APPLICATION_COMMANDS: "Use Application Commands",
        USE_EXTERNAL_EMOJIS: "Use External Emojis",
        USE_EXTERNAL_STICKERS: "Use External Stickers",
        USE_PRIVATE_THREADS: "Use Private Threads",
        USE_PUBLIC_THREADS: "Use Public Threads",
        USE_VAD: "Use Voice Activity",
        VIEW_AUDIT_LOG: "View Audit Log",
        VIEW_CHANNEL: "Read Messages",
        VIEW_GUILD_INSIGHTS: "View Guild Insights"
    };
}
