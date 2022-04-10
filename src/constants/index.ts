export const embedInfoColor = process.env.CONFIG_EMBED_INFO_COLOR!;
export const Emojis = {
    YES: process.env.CONFIG_EMOJI_YES!,
    NO: process.env.CONFIG_EMOJI_NO!
};

if (typeof process.env.CONFIG_EMBED_INFO_COLOR !== "string") throw new Error("CONFIG_EMBED_INFO_COLOR must be a hex color string");
for (const emoji of Object.entries(Emojis)) {
    if (typeof emoji[1] !== "string") throw new Error(`CONFIG_${emoji[0]} must be a string`);
}
