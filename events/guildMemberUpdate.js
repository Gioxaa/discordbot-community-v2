const { readDatabase, writeDatabase } = require('../utils/database');

module.exports = {
  name: 'guildMemberUpdate',
  execute: async (oldMember, newMember) => {
    const database = readDatabase();
    if (!database.roles) return;

    const userData = database.roles.find(entry => entry.userId === newMember.id);
    if (!userData) return;

    if (!newMember.premiumSince && userData.boosterStatus === 'active') {
      try {
        const role = await newMember.guild.roles.fetch(userData.roleId);
        if (role) {
          await newMember.roles.remove(role);
          userData.boosterStatus = 'inactive';
          writeDatabase(database);
          console.log(`Role ${role.name} telah dicopot dari ${newMember.user.tag}`);
        }
      } catch (error) {
        console.error(`Gagal menghapus role untuk ${newMember.user.tag}:`, error);
      }
    }
  }
};