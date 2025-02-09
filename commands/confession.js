const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

// Variabel global untuk menyimpan ID pesan confession yang "aktif"
// (pesan yang masih memiliki tombol "New Confess")
let activeConfessionMessageId = null;

// Fungsi helper untuk merespons interaksi dengan opsi ephemeral: true
const safeReply = async (interaction, options) => {
  const finalOptions = { ...options, ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(finalOptions);
  } else {
    return interaction.reply(finalOptions);
  }
};

module.exports = {
  data: {
    name: 'confession',
    description: 'Submit your confession anonymously'
  },
  async execute(interaction, client) {
    try {
      const confessionChannelId = process.env.CONFESSION_CHANNEL_ID;
      if (!confessionChannelId) {
        return safeReply(interaction, { 
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Configuration Error')
              .setDescription('```fix\n[ CONFESSION_CHANNEL_ID is not defined ]\n```')
          ]
        });
      }
  
      // 1. Slash Command: Tampilkan Modal Submit Confession
      if (interaction.isChatInputCommand()) {
        const modal = new ModalBuilder()
          .setCustomId('confessionModal')
          .setTitle('Submit Your Confession');
  
        const confessionInput = new TextInputBuilder()
          .setCustomId('confessionInput')
          .setLabel('Your Confession')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Write your confession here...')
          .setRequired(true);
  
        const row = new ActionRowBuilder().addComponents(confessionInput);
        modal.addComponents(row);
  
        try {
          return await interaction.showModal(modal);
        } catch (err) {
          if (err.code === 40060) return;
          return safeReply(interaction, { 
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Modal Error')
                .setDescription('```arm\n[ Failed to open the confession modal. Please try again later. ]\n```')
            ]
          });
        }
      }
  
      // 2. Modal Submission
      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'confessionModal') {
          const confessionText = interaction.fields.getTextInputValue('confessionInput');
  
          if (activeConfessionMessageId) {
            try {
              const confessionChannel = await client.channels.fetch(confessionChannelId);
              const prevMessage = await confessionChannel.messages.fetch(activeConfessionMessageId);
              if (prevMessage) {
                const updatedComponents = prevMessage.components.map(row => {
                  const newRow = ActionRowBuilder.from(row);
                  newRow.components = newRow.components.filter(c => c.customId !== 'newConfession');
                  return newRow;
                });
                await prevMessage.edit({ components: updatedComponents });
              }
            } catch (err) {
              // Abaikan error
            }
          }
  
          const confessionEmbed = new EmbedBuilder()
            .setColor('#9C27B0')
            .setTitle('New Confession Received')
            .setDescription(confessionText)
            .setTimestamp()
            .setFooter({ text: 'Anonymous Confession' });
  
          // Buat tombol: Reply dan New Confess
          const replyButton = new ButtonBuilder()
            .setCustomId('replyConfession')
            .setLabel('💬 Reply')
            .setStyle(ButtonStyle.Primary);
          const newConfessButton = new ButtonBuilder()
            .setCustomId('newConfession')
            .setLabel('📑 New Confess')
            .setStyle(ButtonStyle.Success);
          const actionRow = new ActionRowBuilder().addComponents(replyButton, newConfessButton);
  
          try {
            const confessionChannel = await client.channels.fetch(confessionChannelId);
            const sentMessage = await confessionChannel.send({ embeds: [confessionEmbed], components: [actionRow] });
            activeConfessionMessageId = sentMessage.id;
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#00FF00')
                  .setTitle('Submission Successful')
                  .setDescription('```diff\n+ Your confession has been submitted successfully. +\n```')
              ]
            });
          } catch (err) {
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('Critical Failure')
                  .setDescription('```arm\n[ An error occurred while submitting your confession. ]\n```')
              ]
            });
          }
        }
  
        // B. Submit Reply (modal dengan customId yang diawali "replyModal_")
        if (interaction.customId.startsWith('replyModal_')) {
          // Format customId: replyModal_<parentMessageId>
          const parts = interaction.customId.split('_');
          const parentMessageId = parts[1];
          const replyText = interaction.fields.getTextInputValue('replyInput');
  
          const replyEmbed = new EmbedBuilder()
            .setColor('#9C27B0')
            .setTitle('New Reply Received')
            .setDescription(replyText)
            .setTimestamp()
            .setFooter({ text: 'Anonymous Reply' });
  
          // Buat tombol: Reply dan New Confess
          const replyButton = new ButtonBuilder()
            .setCustomId('replyConfession')
            .setLabel('💬 Reply')
            .setStyle(ButtonStyle.Primary);
          const newConfessButton = new ButtonBuilder()
            .setCustomId('newConfession')
            .setLabel('📑 New Confess')
            .setStyle(ButtonStyle.Success);
          const replyActionRow = new ActionRowBuilder().addComponents(replyButton, newConfessButton);
  
          try {
            const confessionChannel = await client.channels.fetch(confessionChannelId);
            const parentMessage = await confessionChannel.messages.fetch(parentMessageId);
            await confessionChannel.send({ 
              embeds: [replyEmbed], 
              components: [replyActionRow], 
              reply: { messageReference: parentMessage.id } 
            });
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#00FF00')
                  .setTitle('Reply Submitted')
                  .setDescription('```diff\n+ Your reply has been posted successfully. +\n```')
              ]
            });
          } catch (err) {
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('Critical Failure')
                  .setDescription('```arm\n[ An error occurred while submitting your reply. ]\n```')
              ]
            });
          }
        }
      }
  
      // 3. Button Interactions
      if (interaction.isButton()) {
        if (interaction.customId === 'newConfession') {
          const modal = new ModalBuilder()
            .setCustomId('confessionModal')
            .setTitle('Submit Your Confession');
  
          const confessionInput = new TextInputBuilder()
            .setCustomId('confessionInput')
            .setLabel('Your Confession')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Write your confession here...')
            .setRequired(true);
  
          const row = new ActionRowBuilder().addComponents(confessionInput);
          modal.addComponents(row);
          try {
            return await interaction.showModal(modal);
          } catch (err) {
            if (err.code === 40060) return;
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('Modal Error')
                  .setDescription('```arm\n[ Failed to open the confession modal. Please try again later. ]\n```')
              ]
            });
          }
        }
        if (interaction.customId === 'replyConfession') {
          const parentMessageId = interaction.message.id;
          const modal = new ModalBuilder()
            .setCustomId(`replyModal_${parentMessageId}`)
            .setTitle('Submit Your Reply');
  
          const replyInput = new TextInputBuilder()
            .setCustomId('replyInput')
            .setLabel('Your Reply')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your reply here...')
            .setRequired(true);
  
          const row = new ActionRowBuilder().addComponents(replyInput);
          modal.addComponents(row);
          try {
            return await interaction.showModal(modal);
          } catch (err) {
            if (err.code === 40060) return;
            return safeReply(interaction, { 
              embeds: [
                new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('Modal Error')
                  .setDescription('```arm\n[ Failed to open the reply modal. Please try again later. ]\n```')
              ]
            });
          }
        }
      }
    } catch (error) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Unexpected Error')
                .setDescription('```arm\n[ An error occurred while processing your request. ]\n```')
            ],
            ephemeral: true
          });
        } else {
          await interaction.followUp({ 
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Unexpected Error')
                .setDescription('```arm\n[ An error occurred while processing your request. ]\n```')
            ],
            ephemeral: true
          });
        }
      } catch (_) {
        // Silent catch tambahan
      }
    }
  }
};
