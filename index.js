require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Inisialisasi koleksi commands
client.commands = new Map();

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Load commands langsung dari folder 'commands'
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Gunakan nama file (tanpa ekstensi) yang diubah ke huruf kecil sebagai key
  const commandName = path.parse(file).name.toLowerCase();
  client.commands.set(commandName, command);
}

// Handler untuk semua jenis interaksi
client.on('interactionCreate', async interaction => {
  try {
    // Jika interaksi adalah slash command (chat input)
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
    } 
    // Jika interaksi adalah modal submit atau button
    else if (interaction.isModalSubmit() || interaction.isButton()) {
      // Misal, untuk sementara kita anggap semua interaksi modal/button adalah bagian dari command "confession"
      const confessionCommand = client.commands.get('confession');
      if (confessionCommand) {
        await confessionCommand.execute(interaction, client);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    // Jika interaksi belum direspon, gunakan reply; jika sudah, gunakan followUp
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Terjadi kesalahan saat menjalankan command!', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'Terjadi kesalahan saat menjalankan command!', ephemeral: true });
    }
  }
});

client.login(process.env.BOT_TOKEN);
