export const embedInfoColor = process.env.CONFIG_EMBED_INFO_COLOR!;
export const Emojis = {
    YES: process.env.CONFIG_EMOJI_YES!,
    NO: process.env.CONFIG_EMOJI_NO!
};

export const Images = {
    DEFAULT_BANNER: process.env.CONFIG_DEFAULT_BANNER!
};

if (typeof process.env.CONFIG_EMBED_INFO_COLOR !== "string") throw new Error("CONFIG_EMBED_INFO_COLOR must be a hex color string");
for (const object of Object.entries(Emojis).concat(Object.entries(Images))) {
    if (typeof object[1] !== "string") throw new Error(`CONFIG_${object[0]} must be a string`);
}
