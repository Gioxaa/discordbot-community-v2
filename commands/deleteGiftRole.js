const { EmbedBuilder } = require('discord.js');
const { readDatabase } = require('../utils/database');
const { readGiftDatabase, writeGiftDatabase } = require('../utils/giftDatabase');

module.exports = {
  // Tidak ada properti "data" di sini, karena definisi slash command akan dibuat di deploy-commands.js
  async execute(interaction, client) {
    try {
      // Dapatkan target user dari opsi command
      const targetUser = interaction.options.getUser('target');
      if (!targetUser) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Missing Target User')
              .setDescription('Please specify the user whose gift you want to remove.')
          ]
        });
      }
      
      // Ambil database custom role (misalnya, dibuat oleh command createcostumroles)
      const roleDB = readDatabase();
      // Cari entri booster untuk user yang menjalankan command
      const boosterEntry = roleDB.roles.find(entry => entry.userId === interaction.user.id);
      if (!boosterEntry) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('No Custom Role Found')
              .setDescription('You do not have a custom role that can be gifted.')
          ]
        });
      }
      
      // Ambil database gift
      const giftDB = readGiftDatabase();
      // Cari entri gift untuk booster (menggunakan boosterId)
      const giftEntry = giftDB.gifts.find(entry => entry.boosterId === interaction.user.id);
      if (!giftEntry) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('No Gift Record')
              .setDescription('You have not gifted your custom role to anyone.')
          ]
        });
      }
      
      // Periksa apakah target user ada di daftar gift
      if (!giftEntry.gifted.includes(targetUser.id)) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('Gift Not Found')
              .setDescription('The specified user has not been gifted your custom role.')
          ]
        });
      }
      
      // Batas maksimum gift (misalnya, booster boleh memberikan gift ke maksimal 3 orang)
      // Jika kamu ingin memastikan bahwa booster hanya bisa menghapus gift jika telah diberikan ke kurang dari 3,
      // biasanya logika pembatasan gift diterapkan saat memberi gift.
      // Di sini, kita fokus pada menghapus gift yang sudah ada.
      
      // Hapus target dari daftar gifted
      giftEntry.gifted = giftEntry.gifted.filter(id => id !== targetUser.id);
      writeGiftDatabase(giftDB);
      
      // Hapus custom role dari target di guild
      const roleId = boosterEntry.roleId;
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (targetMember && targetMember.roles.cache.has(roleId)) {
        await targetMember.roles.remove(roleId, `Gift role removed by ${interaction.user.tag}`);
      }
      
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Gift Role Removed')
            .setDescription(`Your custom role has been removed from ${targetUser.tag}.`)
        ]
      });
    } catch (error) {
      console.error('Error in deleteGiftRole command:', error);
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('An error occurred while processing your request.')
        ]
      });
    }
  }
};
