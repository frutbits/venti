import { Guild, GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { ShoukakuHandler } from "../structures/ShoukakuHandler";

export interface DispatcherOptions {
    guild: Guild;
    member: GuildMember;
    textChannel: TextChannel;
    voiceChannel: VoiceChannel;
}

declare module "discord.js" {
    interface Client {
        shoukaku: ShoukakuHandler;
    }
}

declare module "@sapphire/framework" {
    export interface Preconditions {
        ownerOnly: never;
        memberInVoice: never;
        memberVoiceJoinable: never;
        memberInSameVoice: never;
        isNodeAvailable: never;
    }
}
