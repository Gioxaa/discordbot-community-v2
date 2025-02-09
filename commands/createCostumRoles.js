const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const { readDatabase, writeDatabase } = require('../utils/database');

module.exports = {
  name: 'createcostumroles',
  execute: async (interaction) => {
    // Initial response with a loading embed
    const initialEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('<a:loading:1076536009147289650> Processing Request...')
      .setDescription('```css\n[ INITIATING CUSTOM ROLE CREATION PROTOCOL ]\n```');
    
    await interaction.reply({ embeds: [initialEmbed], ephemeral: false });

    // Channel validation
    if (interaction.channelId !== process.env.CUSTOM_ROLE_CHANNEL_ID) {
      const channelErrorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 Restricted Access')
        .setDescription(`**This command can only be used in:**\n<#${process.env.CUSTOM_ROLE_CHANNEL_ID}>`)
        .setThumbnail('https://i.imgur.com/X8vB9PU.png');
      
      return interaction.editReply({ embeds: [channelErrorEmbed] });
    }

    // Permission check: allowed roles OR active server booster
    const allowedRoles = process.env.ALLOWED_COSTUMROLE.split(',').map(id => id.trim());
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id)) || interaction.member.premiumSince;
    
    if (!hasPermission) {
      const permEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🔒 Permission Denied')
        .setDescription('```diff\n- You lack the required authority to create a custom role!\n```')
        .addFields({
          name: 'Required Roles',
          value: allowedRoles.map(r => `<@&${r}>`).join('\n') || 'None specified'
        })
        .setFooter({ text: 'Contact server staff for access', iconURL: interaction.user.displayAvatarURL() });
      
      return interaction.editReply({ embeds: [permEmbed] });
    }

    // Pastikan kita mendapatkan data member terbaru untuk pengecekan booster yang akurat
    const fetchedMember = await interaction.guild.members.fetch(interaction.user.id);

    // Database check: ensure the user doesn't already have a custom role
    const database = readDatabase();
    const userData = database.roles.find(entry => entry.userId === interaction.user.id);

    if (userData) {
      const alreadyExistsEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚠️ Custom Role Already Exists')
        .setDescription('```fix\nYou have already created a custom role! You can only have one custom role.\n```')
        .setThumbnail('https://i.imgur.com/9n1qF3x.png')
        .setFooter({ text: 'Remove your current role to create a new one', iconURL: interaction.user.displayAvatarURL() });
      
      return interaction.editReply({ embeds: [alreadyExistsEmbed] });
    }

    // Retrieve command options: role name, color, and optional icon attachment
    const roleName = interaction.options.getString('name');
    const roleColor = interaction.options.getString('color');
    const hexColorRegex = /^([0-9A-Fa-f]{6})$/;
    
    if (!hexColorRegex.test(roleColor)) {
      const colorErrorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Invalid Color Format')
        .setDescription('```fix\nPlease provide a valid hex color code, e.g. FF5733\n```')
        .setThumbnail('https://i.imgur.com/X8vB9PU.png');
      
      return interaction.editReply({ embeds: [colorErrorEmbed] });
    }
    
    const attachment = interaction.options.getAttachment('icon');
    const roleIcon = attachment ? attachment.url : undefined;

    // Role creation process
    try {
      const newRole = await interaction.guild.roles.create({
        name: roleName,
        color: roleColor,
        icon: roleIcon,
        reason: `Custom role created by ${interaction.user.tag} via /createcostumroles`
      });

      // Jika variabel MEMBER_ROLE_ID diset, atur posisi role baru agar berada tepat di atas role dasar
      if (process.env.MEMBER_ROLE_ID) {
        const baseRole = interaction.guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
        if (baseRole) {
          try {
            // Set posisi custom role agar berada 1 tingkat di atas baseRole
            await newRole.setPosition(baseRole.position, `Role created above ${baseRole.name}`);
          } catch (posError) {
            console.error("Error setting role position:", posError);
          }
        } else {
          console.log("MEMBER_ROLE_ID is set but no matching role was found in this guild.");
        }
      }

      // Add the newly created role to the user
      await interaction.member.roles.add(newRole);

      // Update our database with the new custom role
      const boosterStatus = fetchedMember.premiumSince instanceof Date ? 'active' : 'inactive';
      database.roles.push({
        userId: interaction.user.id,
        roleId: newRole.id,
        boosterStatus: boosterStatus
      });
      writeDatabase(database);

      // Build a success embed with extra details
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 Custom Role Created')
        .setDescription('```diff\n+ SUCCESSFULLY CREATED CUSTOM ROLE +\n```')
        .addFields(
          { name: 'User', value: interaction.user.toString(), inline: true },
          { name: 'Role Name', value: newRole.name, inline: true },
          { name: 'Role ID', value: newRole.id, inline: true },
          { name: 'Hex Color', value: `#${roleColor.toUpperCase()}`, inline: true },
          { name: 'Booster Status', value: boosterStatus === 'active' ? 'Active 🚀' : 'Inactive', inline: true }
        )
        .setFooter({ 
          text: `Role Creation Complete • ${new Date().toLocaleString()}`, 
          iconURL: interaction.client.user.displayAvatarURL() 
        });
      
      // Set thumbnail to the provided role icon or a default image
      if (roleIcon) {
        successEmbed.setThumbnail(roleIcon);
      } else {
        successEmbed.setThumbnail('https://i.imgur.com/Z7eYd3H.png');
      }

      // Optional: Add an action row with a support button for extra flair
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL(process.env.SUPPORT_SERVER_URL)
      );

      return interaction.editReply({ embeds: [successEmbed], components: [row] });
    } catch (error) {
      console.error('[CUSTOM ROLE CREATION ERROR]', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💥 Critical Failure')
        .setDescription('```arm\n[ CUSTOM ROLE CREATION SEQUENCE FAILED ]\n```')
        .addFields(
          { name: 'Error Code', value: `\`${error.code || 'N/A'}\``, inline: true },
          { name: 'Error Message', value: `\`\`\`${error.message.slice(0, 1000)}\`\`\`` }
        )
        .setFooter({ text: 'Contact bot maintainer', iconURL: interaction.client.user.displayAvatarURL() });
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
