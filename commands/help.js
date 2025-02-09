const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} = require('discord.js');

module.exports = {
  execute: async (interaction) => {
    try {
      // Hanya panggil deferReply jika interaksi belum di-respon
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }
      
      // Data kategori command
      const categories = {
        general: {
          title: 'General Commands',
          commands: [
            { name: '/ping', description: 'Check bot responsiveness.' },
            { name: '/help', description: 'Display this help menu.' },
            { name: '/confession', description: 'Submit your confession anonymously.' },
            { name: '/introduction', description: 'Submit your personal introduction.' }
          ]
        },
        booster: {
          title: 'Booster Commands',
          commands: [
            { name: '/createcustomroles', description: 'Craft your unique identity with a custom role.' },
            { name: '/giftrole', description: 'Gift your custom role to a friend (max 3 per booster).' },
            { name: '/deletegiftrole', description: 'Remove a gifted custom role from a friend.' },
            { name: '/listcustomroles', description: 'Browse the registry of custom roles and gift info.' }
          ]
        },
        owner: {
          title: 'Owner Commands',
          commands: [
            { name: '/deletecustomroles', description: 'Remove a custom role from a user.' }
          ]
        }
      };

      // Fungsi untuk menyusun embed berdasarkan kategori
      const buildEmbed = (categoryKey) => {
        const category = categories[categoryKey];
        // Hitung uptime
        const uptimeSeconds = Math.floor(interaction.client.uptime / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);
  
        const embed = new EmbedBuilder()
          .setColor('#6A00FF')
          .setTitle(`<:cosmic_compass:1075986678426992751> **${category.title}**`)
          .setDescription([
            '**Explore my command galaxy**',
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
          ].join('\n'))
          .setThumbnail('https://i.imgur.com/St4T7vQ.png')
          .addFields({
            name: 'Commands',
            value: category.commands.map(cmd => `✦ \`${cmd.name}\` – ${cmd.description}`).join('\n'),
            inline: false
          },
          {
            name: '📊 System Status',
            value: [
              `⌛ **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s`,
              `🌍 **Servers:** ${interaction.client.guilds.cache.size.toLocaleString()}`,
              `👥 **Members:** ${interaction.client.users.cache.size.toLocaleString()}`
            ].join('\n'),
            inline: true
          })
          .setFooter({ 
            text: `Requested by ${interaction.user.username} • Powered by Cosmic Engine`, 
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        return embed;
      };

      // Default kategori adalah 'general'
      const defaultCategory = 'general';
      const defaultEmbed = buildEmbed(defaultCategory);

      // Buat select menu (dropdown) untuk memilih kategori
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('helpSelectMenu')
        .setPlaceholder('Select a command category...')
        .addOptions([
          {
            label: 'General Commands',
            value: 'general',
            description: 'Show general commands'
          },
          {
            label: 'Booster Commands',
            value: 'booster',
            description: 'Show booster commands'
          },
          {
            label: 'Owner Commands',
            value: 'owner',
            description: 'Show owner commands'
          }
        ]);

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);

      // Kirim embed awal dengan dropdown
      const helpMessage = await interaction.editReply({
        embeds: [defaultEmbed],
        components: [menuRow]
      });

      // Buat collector untuk select menu interaksi (hanya user yang sama yang dapat berinteraksi)
      const filter = i => i.customId === 'helpSelectMenu' && i.user.id === interaction.user.id;
      const collector = helpMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect });

      collector.on('collect', async (i) => {
        const selectedCategory = i.values[0];
        const newEmbed = buildEmbed(selectedCategory);
        try {
          await i.update({ embeds: [newEmbed] });
        } catch (_) {
          // Jika gagal, tidak perlu di-log
        }
      });

      collector.on('end', async () => {
        // Nonaktifkan select menu setelah timeout
        const disabledRow = ActionRowBuilder.from(menuRow).setComponents(
          menuRow.components.map(component => component.setDisabled(true))
        );
        try {
          await interaction.editReply({ components: [disabledRow] });
        } catch (_) {}
      });
    } catch (error) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ An error occurred while displaying help.', ephemeral: true });
        } else {
          await interaction.followUp({ content: '❌ An error occurred while displaying help.', ephemeral: true });
        }
      } catch (_) {}
    }
  }
};
