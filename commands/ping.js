const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  execute: async (interaction, client) => {
    try {
      // Defer reply agar tidak timeout (fetchReply: true agar kita bisa mendapatkan pesan yang dikirim)
      await interaction.deferReply({ fetchReply: true });
      
      const sent = await interaction.fetchReply();
      const ping = sent.createdTimestamp - interaction.createdTimestamp;

      // Perhitungan uptime
      const uptime = Math.floor(client.uptime / 1000);
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      // Warna dinamis berdasarkan ping
      const statusColor = ping < 150 ? '#00FF00' : ping < 300 ? '#FFFF00' : '#FF0000';

      const embed = new EmbedBuilder()
        .setTitle('<:server:1145356057237139507> **SYSTEM STATUS**')
        .setColor(statusColor)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setDescription([
          '```diff',
          `+ Last Heartbeat: ${Date.now() - sent.createdTimestamp}ms`,
          '```',
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        ].join('\n'))
        .addFields(
          {
            name: '📶 NETWORK STATS',
            value: `⌛ **Latency:** \`${ping}ms\`\n📡 **API Latency:** \`${Math.round(client.ws.ping)}ms\`\n🌐 **Shard:** #${client.shard ? client.shard.ids[0] : 'N/A'}`,
            inline: true
          },
          {
            name: '🖥️ SYSTEM INFO',
            value: `⏳ **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s\n🏰 **Guilds:** ${client.guilds.cache.size.toLocaleString()}\n👥 **Users:** ${client.users.cache.size.toLocaleString()}`,
            inline: true
          },
          {
            name: '🌍 LOCATION DATA',
            value: `📍 **Region:** ${interaction.guild.preferredLocale.toUpperCase()}\n🆔 **Guild ID:** ${interaction.guildId}\n📂 **Channel ID:** ${interaction.channelId}`,
            inline: false
          }
        )
        .setFooter({ 
          text: `Requested by ${interaction.user.tag} • Real-time Diagnostics`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Tombol refresh
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_ping')
          .setLabel('🔄 Refresh Stats')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ 
        embeds: [embed], 
        components: [row] 
      });
      
    } catch (error) {
      // Tangani error tanpa mencetak ke console
      if (error.code === 10062 || error.code === 40060) {
        // Jika error known (Unknown interaction atau Interaction already acknowledged), tidak melakukan apa-apa
        return;
      }
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ 
            content: '❌ Terjadi kesalahan saat mengambil data ping.', 
            components: [] 
          });
        } else {
          await interaction.reply({ 
            content: '❌ Terjadi kesalahan saat mengambil data ping.', 
            ephemeral: true 
          });
        }
      } catch (_) {
        // Jika gagal mengirim pesan error, diam saja
      }
    }
  }
};
