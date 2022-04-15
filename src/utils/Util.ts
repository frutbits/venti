import { ColorResolvable, MessageEmbed } from "discord.js";
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
}
