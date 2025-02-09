const { 
  EmbedBuilder 
} = require('discord.js');
const { readDatabase } = require('../utils/database');
const { readGiftDatabase } = require('../utils/giftDatabase');

module.exports = {
  name: 'listcostumroles',
  async execute(interaction) {
    // Initial loading embed
    const loadingEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('<a:loading:1076536009147289650> Fetching Custom Roles...')
      .setDescription('```css\n[ SCANNING THE CUSTOM ROLE REGISTRY ]\n```');
      
    await interaction.reply({ embeds: [loadingEmbed], ephemeral: false });
    
    // Read custom roles database
    const database = readDatabase();
    if (!database.roles || database.roles.length === 0) {
      const noRolesEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 No Custom Roles Found')
        .setDescription('```diff\n- There are no custom roles registered in the database.\n```')
        .setThumbnail('https://i.imgur.com/X8vB9PU.png')
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      return interaction.editReply({ embeds: [noRolesEmbed], ephemeral: true });
    }
    
    // Baca database gift (untuk informasi siapa saja yang di‑gift)
    const giftDB = readGiftDatabase();
    // Siapkan array untuk listing informasi
    let ownerField = [];
    let roleField = [];
    let statusField = [];
    let giftedField = [];
    
    // Process setiap custom role yang terdaftar
    for (const entry of database.roles) {
      const ownerMember = interaction.guild.members.cache.get(entry.userId);
      const role = interaction.guild.roles.cache.get(entry.roleId);
      if (!ownerMember || !role) continue;
      
      // Tentukan status berdasarkan booster (misal: jika member booster, status "Booster 🚀", kalau tidak, "Accessed")
      const isBooster = !!ownerMember.premiumSince;
      const status = isBooster ? 'Booster 🚀' : 'Accessed';
      
      // Dapatkan informasi gift dari giftDB (gunakan boosterId sebagai key)
      let giftedList = 'None';
      if (giftDB && giftDB.gifts) {
        const giftEntry = giftDB.gifts.find(g => g.boosterId === entry.userId);
        if (giftEntry && giftEntry.gifted.length > 0) {
          // Ubah array ID menjadi string mention
          giftedList = giftEntry.gifted.map(userId => `<@${userId}>`).join(' ');
        }
      }
      
      ownerField.push(ownerMember.toString());
      roleField.push(role.toString());
      statusField.push(status);
      giftedField.push(giftedList);
    }
    
    // Jika tidak ada entri valid, kirim pesan error
    if (ownerField.length === 0) {
      const noValidEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 No Custom Roles Available')
        .setDescription('```diff\n- No valid custom roles found on this server.\n```')
        .setThumbnail('https://i.imgur.com/9n1qF3x.png')
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      return interaction.editReply({ embeds: [noValidEmbed], ephemeral: true });
    }
    
    const listEmbed = new EmbedBuilder()
      .setTitle('📌 Daftar Custom Roles')
      .setColor('#0099FF')
      .setTimestamp()
      .setThumbnail('https://i.imgur.com/Z7eYd3H.png')
      .setDescription('```css\n[ CUSTOM ROLES REGISTRY ]\n```')
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      });
    
    listEmbed.addFields(
      { name: '**Owner**', value: ownerField.join('\n'), inline: true },
      { name: '**Role**', value: roleField.join('\n'), inline: true },
      { name: '**Status**', value: statusField.join('\n'), inline: true },
      { name: '**Gifted**', value: giftedField.join(' | '), inline: true }
    );
    
    // Edit reply dengan embed final
    await interaction.editReply({ embeds: [listEmbed] });
  }
};
  