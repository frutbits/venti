import { PrismaClient } from "@prisma/client";
import { Guild, GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { ShoukakuHandler } from "../structures/ShoukakuHandler";
import { Venti } from "../structures/Venti";
import { Util } from "../utils/Util";

export interface DispatcherOptions {
    guild: Guild;
    member: GuildMember;
    textChannel: TextChannel;
    voiceChannel: VoiceChannel;
}

declare module "discord.js" {
    interface Client {
        shoukaku: ShoukakuHandler;
        prisma: PrismaClient;
        util: Util;
        databases: Venti["databases"];
    }
}

declare module "@sapphire/framework" {
    export interface Preconditions {
        ownerOnly: never;
        memberInVoice: never;
        memberVoiceJoinable: never;
        memberInSameVoice: never;
        isNodeAvailable: never;
        isInsideRequester: never;
        isPlayerPlaying: never;
    }
}
