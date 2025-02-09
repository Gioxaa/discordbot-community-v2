// commands/index.js
const fs = require('fs');
const path = require('path');

const commands = {};

// Baca semua file .js di folder commands
const commandFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.js') && file !== 'index.js'
);

// Otomatis impor semua command
for (const file of commandFiles) {
  const command = require(path.join(__dirname, file));
  const commandName = path.parse(file).name;
  commands[commandName] = command;
}

module.exports = commands;