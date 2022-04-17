import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { Collection, GuildMember, Message, Snowflake, VoiceState } from "discord.js";
import { deleteQueueTimeout } from "../../config";
import { Dispatcher } from "../../structures/Dispatcher";
import { Util } from "../../utils/Util";

@ApplyOptions<Listener.Options>({
    event: "voiceStateUpdate"
})
export class VoiceStateUpdateEvent extends Listener {
    public override async run(oldState: VoiceState, newState: VoiceState): Promise<any> {
        const dispatcher = this.container.client.shoukaku.queue.get(newState.guild.id);
        if (!dispatcher) return undefined;

        const newVC = newState.channel;
        const oldVC = oldState.channel;
        const oldID = oldVC?.id;
        const newID = newVC?.id;
        const queueVC = dispatcher.voiceChannel;
        const oldMember = oldState.member;
        const member = newState.member;
        const queueVCMembers = queueVC.members.filter(m => !m.user.bot);
        const newVCMembers = newVC?.members.filter(m => !m.user.bot);
        const botID = this.container.client.user!.id; // TODO: Handle bot moved & kicked from voice channel in VoiceConnection directly?

        // Handle when bot gets kicked from the voice channel
        if (oldMember?.id === botID && oldID === queueVC.id && newID === undefined) {
            try {
                dispatcher.player?.setPaused(true);
                clearTimeout(dispatcher.timeout!);
                this.container.client.logger.info(`Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`);
                const msg = await dispatcher.textChannel.send({
                    embeds: [
                        Util.createEmbed("warn", "I was disconnected from the voice channel, the queue will be deleted")
                    ]
                })
                    .then(m => { dispatcher.oldMusicMessage = null; dispatcher.oldVoiceStateUpdateMessage = null; return m; })
                    .catch(e => {
                        this.container.client.logger.error(e);
                        return undefined;
                    });
                if (dispatcher.embedPlayer?.textChannel) {
                    setTimeout(async () => {
                        if (msg?.deletable) await msg.delete();
                    }, 5000);
                }
                dispatcher.destroy();
            } catch (e) {
                this.container.client.logger.error(e);
            }
        }

        if (newState.mute !== oldState.mute || newState.deaf !== oldState.deaf) return undefined; // TODO: Handle all listeners deaf & bot muted event?

        // Handle when the bot is moved to another voice channel
        if (member?.id === botID && oldID === queueVC.id && newID !== queueVC.id && newID !== undefined) {
            if (!newVCMembers) return undefined;
            if (newVCMembers.size === 0 && dispatcher.timeout === null) this.doTimeout(newVCMembers, dispatcher);
            else if (newVCMembers.size !== 0 && dispatcher.timeout !== null) this.resumeTimeout(newVCMembers, dispatcher);
        }

        // Handle when user leaves voice channel
        if (
            oldID === queueVC.id &&
            newID !== queueVC.id &&
            !member?.user.bot &&
            dispatcher.timeout === null &&
            deleteQueueTimeout !== 0
        ) this.doTimeout(queueVCMembers, dispatcher);

        // Handle when user joins voice channel or bot gets moved
        if (newID === queueVC.id && !member?.user.bot && deleteQueueTimeout !== 0) this.resumeTimeout(queueVCMembers, dispatcher);
    }

    private doTimeout(vcMembers: Collection<Snowflake, GuildMember>, dispatcher: Dispatcher): any {
        try {
            if (vcMembers.size !== 0) return undefined;
            clearTimeout(dispatcher.timeout!);
            dispatcher.timeout = null;
            dispatcher.player?.setPaused(true);
            const duration = Util.formatMS(deleteQueueTimeout);
            dispatcher.oldVoiceStateUpdateMessage = null;
            dispatcher.timeout = setTimeout(async () => {
                dispatcher.oldMusicMessage = null; dispatcher.oldVoiceStateUpdateMessage = null;
                const msg = await dispatcher.textChannel.send({
                    embeds: [
                        Util.createEmbed("error", `**${duration}** have passed and there is no one who joins my voice channel, the queue was deleted.`)
                            .setTitle("⏹ Queue deleted.")
                    ]
                }).catch(e => this.container.client.logger.error(e));
                dispatcher.destroy();
                if (dispatcher.embedPlayer?.textChannel) {
                    setTimeout(async () => {
                        if ((msg as Message | undefined)?.deletable) await (msg as Message).delete();
                    }, 5000);
                }
            }, deleteQueueTimeout);
            dispatcher.textChannel.send({
                embeds: [
                    Util.createEmbed("warn", `
Everyone has left from my voice channel, to save resources, the queue was paused.
If there's no one who joins my voice channel in the next **${duration}**, the queue will be deleted.
                    `)
                        .setTitle("⏸ Queue paused.")
                ]
            }).then(m => dispatcher.oldVoiceStateUpdateMessage = m.id).catch(e => this.container.client.logger.error(e));
        } catch (e) { this.container.client.logger.error(e); }
    }

    private resumeTimeout(vcMembers: Collection<Snowflake, GuildMember>, dispatcher: Dispatcher): any {
        if (vcMembers.size > 0) {
            if (!dispatcher.player?.paused) return undefined;
            try {
                clearTimeout(dispatcher.timeout!);
                dispatcher.timeout = null;
                dispatcher.oldVoiceStateUpdateMessage = null;
                dispatcher.player.setPaused(false);
            } catch (e) { this.container.client.logger.error(e); }
        }
    }
}
