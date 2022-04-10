export const embedInfoColor = process.env.EMBED_INFO_COLOR!;
export const Emojis = {
    YES: process.env.EMOJI_YES!,
    NO: process.env.EMOJI_NO!
};

if (typeof process.env.EMBED_INFO_COLOR !== "string") throw new Error("EMBED_INFO_COLOR must be a hex color string");
for (const emoji of Object.entries(Emojis)) {
    if (typeof emoji[1] !== "string") throw new Error(`EMOJI_${emoji[0]} must be a string`);
}
