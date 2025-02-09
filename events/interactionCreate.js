const commands = require('../commands/index');

module.exports = {
  name: 'interactionCreate',
  execute: async (interaction, client) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guildId) return;
    if (interaction.user.bot) return;

    const command = commands[interaction.commandName.toLowerCase()];
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'Terjadi kesalahan saat menjalankan command ini!', 
        ephemeral: true 
      });
    }
  }
};