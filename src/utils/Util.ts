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

    public static isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
