const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } = require('discord.js');
  const { readDatabase } = require('../utils/database');  // Database custom role (misalnya, roles)
  const { readGiftDatabase, writeGiftDatabase } = require('../utils/giftDatabase');
  
  module.exports = {
    // Tidak ada properti "data" di sini; definisi slash command akan didefinisikan di deploy-commands.js
    async execute(interaction, client) {
      try {
        // Ambil custom role booster dari database (misalnya, disimpan di database.roles)
        const roleDB = readDatabase();
        const boosterEntry = roleDB.roles.find(entry => entry.userId === interaction.user.id);
        if (!boosterEntry) {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('No Custom Role Found')
                .setDescription('You do not have a custom role to gift.')
            ]
          });
        }
  
        // Ambil target user dari opsi (didefinisikan di deploy-commands.js)
        const targetUser = interaction.options.getUser('target');
        if (!targetUser) {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Missing Target User')
                .setDescription('Please specify a friend to gift your custom role.')
            ]
          });
        }
  
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('User Not Found')
                .setDescription('The specified friend is not in this server.')
            ]
          });
        }
  
        // Periksa apakah target sudah memiliki custom role tersebut
        if (targetMember.roles.cache.has(boosterEntry.roleId)) {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Role Already Assigned')
                .setDescription('Your friend already has your custom role.')
            ]
          });
        }
  
        // Baca database gift
        const giftDB = readGiftDatabase();
        // Cari entri gift untuk booster
        let boosterGift = giftDB.gifts.find(entry => entry.boosterId === interaction.user.id);
        if (!boosterGift) {
          boosterGift = { boosterId: interaction.user.id, gifted: [] };
          giftDB.gifts.push(boosterGift);
        }
  
        // Periksa batas maksimal gift (misalnya, 3)
        if (boosterGift.gifted.length >= 3) {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Gift Limit Reached')
                .setDescription('You have already gifted your custom role to the maximum number of users (3).')
            ]
          });
        }
  
        // Jika target belum ada di daftar gift, tambahkan
        if (!boosterGift.gifted.includes(targetUser.id)) {
          boosterGift.gifted.push(targetUser.id);
          writeGiftDatabase(giftDB);
        } else {
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Already Gifted')
                .setDescription('You have already gifted your custom role to this user.')
            ]
          });
        }
  
        // Tambahkan custom role ke target member
        try {
          await targetMember.roles.add(boosterEntry.roleId, `Gifted by ${interaction.user.tag}`);
        } catch (error) {
          console.error("Error adding role to target member:", error);
          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Failed to add the role to the target user.')
            ]
          });
        }
  
        // Kirim DM ke target (jika memungkinkan)
        if (!targetUser.bot) {
            try {
              await targetUser.send(`You have been gifted a custom role by ${interaction.user.tag} in ${interaction.guild.name}!`);
            } catch (dmError) {
              console.error("Error sending DM to target user:", dmError);
            }
          } else {
            console.log("Target user is a bot; skipping DM.");
          }
  
        // Balas interaksi dengan sukses
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('Role Gifted Successfully')
              .setDescription(`Your custom role has been gifted to ${targetUser.tag}.`)
          ]
        });
      } catch (error) {
        console.error('Error in giftRole command:', error);
        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Error')
              .setDescription('An error occurred while processing your gift role command.')
          ]
        });
      }
    }
  };
  