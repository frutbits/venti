import { CommandOptions, Command, Args } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, MessageEmbed } from "discord.js";
import util from "util";
import { codeBlock } from "@discordjs/builders";
import { reply } from "@sapphire/plugin-editable-commands";

@ApplyOptions<CommandOptions>({
    aliases: [],
    name: "eval",
    quotes: [],
    description: "owo whats this",
    preconditions: ["ownerOnly"],
    requiredClientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"]
})
export class EvalCommand extends Command {
    public async messageRun(message: Message, args: Args): Promise<any> {
        const msg = message;
        const userArgument = await args.restResult("string");
        if (!userArgument.success) return reply(message, { embeds: [new MessageEmbed().setDescription("❌ | You need to input code")] });
        const code = userArgument.value
            .replace(/`/g, `\`${String.fromCharCode(8203)}`)
            .replace(/@/g, `@${String.fromCharCode(8203)}`)
            .replace(this.container.client.token!, "[Censored]");
        try {
            // eslint-disable-next-line no-eval
            let { evaled } = await EvalCommand.parseEval(eval(code));
            if (typeof evaled !== "string") evaled = util.inspect(evaled, { depth: 0 });
            await reply(msg, {
                content: codeBlock("js", evaled)
            });
        } catch (e: any) {
            await reply(msg, {
                content: codeBlock("js", (e as Error).message)
            });
        }
    }

    public static parseType(input: any): string {
        if (input instanceof Buffer) {
            let length = Math.round(input.length / 1024 / 1024);
            let ic = "MB";
            if (!length) {
                length = Math.round(input.length / 1024);
                ic = "KB";
            }
            if (!length) {
                length = Math.round(input.length);
                ic = "Bytes";
            }
            return `Buffer (${length} ${ic})`;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return input === null || input === undefined ? "Void" : input.constructor.name;
    }

    public static async parseEval(input: any): Promise<{ evaled: string; type: string }> {
        const isPromise =
            input instanceof Promise &&
            typeof input.then === "function" &&
            typeof input.catch === "function";
        if (isPromise) {
            input = await input;
            return {
                evaled: input,
                type: `Promise<${EvalCommand.parseType(input)}>`
            };
        }
        return {
            evaled: input,
            type: EvalCommand.parseType(input)
        };
    }
}
