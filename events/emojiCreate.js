module.exports = {
    func: async (client, sql, Discord) => {
        client.bot.on("emojiCreate", async emoji => {
            try {
                if (!emoji.guild.me.hasPermission("VIEW_AUDIT_LOG")) return;
                let r = await sql.get(`SELECT * FROM logChannel WHERE guildId = ${emoji.guild.id}`);
                async function logChannel(selectedChannel) {
                    if (!selectedChannel) return;
                    if (!emoji.guild.me.hasPermission("SEND_MESSAGES")) return;
                    if (!emoji.guild.me.permissionsIn(selectedChannel).has("SEND_MESSAGES")) {
                        if (!emoji.guild.me.hasPermission("ADMINISTRATOR")) return;
                    }
                    if (!emoji.guild.me.hasPermission("VIEW_CHANNEL")) return;
                    if (!emoji.guild.me.permissionsIn(selectedChannel).has("VIEW_CHANNEL")) {
                        if (!emoji.guild.me.hasPermission("ADMINISTRATOR")) return;
                    }
                    //console.log("emojiCreate.js");
                    async function emojiCreate() {
                        let audit = await emoji.guild.fetchAuditLogs({
                            limit: 1,
                            type: 60 // Emoji Create, look at https://discord.js.org/#/docs/main/stable/typedef/AuditLogAction
                        });
                        let info = audit.entries.first();
                        let embed = new Discord.MessageEmbed()
                            .setAuthor(info.executor.tag, info.executor.displayAvatarURL())
                            .setTitle("Emoji Created")
                            .addField("Time", info.createdAt)
                            .addField("Emoji URL", emoji.url)
                            .addField("Emoji ID", emoji.id)
                            .setColor(0x00FFFF)
                            .setFooter(`Log ID: ${info.id}`);
                        selectedChannel.send(embed);

                        /*
                        Old System
        
                        var embed = new Discord.RichEmbed()
                            .setTitle("New Emoji Created")
                            .addField("Emoji Name", emoji.name)
                            .setColor(0x00FF00)
                            .setThumbnail(emoji.url);
                        selectedChannel.send(embed);
                        */
                    }
                    let row = await sql.get(`SELECT * FROM actionlog WHERE guildId = ${emoji.guild.id}`);
                    if (row && row.bool) {
                        emojiCreate();
                    }
                }
                if (!r) {
                    logChannel(emoji.guild.channels.find(c => c.name === "action-log"));
                } else {
                    logChannel(emoji.guild.channels.get(r.channelId));
                }
            } catch (e) {
                let rollbar = new client.Rollbar(client.rollbarKey);
                rollbar.error("Something went wrong in emojiCreate.js", e);
            }
        });
    }
}