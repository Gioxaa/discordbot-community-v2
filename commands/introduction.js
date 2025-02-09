const { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Tentukan path untuk file data (folder "data" di root)
const dataPath = path.join(__dirname, '../data/introductions.json');
let introductions = {};

// Load data jika file ada
if (fs.existsSync(dataPath)) {
  try {
    introductions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    console.error('Error reading introductions file:', error);
  }
}

// Fungsi untuk menyimpan data secara permanen
function saveIntroductions() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(introductions, null, 2));
  } catch (error) {
    console.error('Error writing introductions file:', error);
  }
}

// Objek untuk menyimpan data sementara dari Modal Part 1
const pendingIntroductions = {};

module.exports = {
  data: {
    name: 'introduction',
    description: 'Submit your personal introduction'
  },
  // Handler untuk slash command /introduction
  async execute(interaction, client) {
    if (introductions[interaction.user.id]) {
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Introduction Already Submitted')
            .setDescription('You have already submitted your introduction.')
        ]
      });
    }

    // Buat Modal Part 1 (data dasar)
    const modalPart1 = new ModalBuilder()
      .setCustomId('introductionModalPart1')
      .setTitle('Introduction - Part 1');

    const nameInput = new TextInputBuilder()
      .setCustomId('nameInput')
      .setLabel('Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your full name')
      .setRequired(true);

    const nicknameInput = new TextInputBuilder()
      .setCustomId('nicknameInput')
      .setLabel('Nickname')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your nickname')
      .setRequired(true);

    const ageInput = new TextInputBuilder()
      .setCustomId('ageInput')
      .setLabel('Age')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your age')
      .setRequired(true);

    const genderInput = new TextInputBuilder()
      .setCustomId('genderPronounsInput')
      .setLabel('Gender & Pronouns')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., Male / He-Him')
      .setRequired(true);

    const languageInput = new TextInputBuilder()
      .setCustomId('languageInput')
      .setLabel('Language')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter your preferred language')
      .setRequired(true);

    modalPart1.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(nicknameInput),
      new ActionRowBuilder().addComponents(ageInput),
      new ActionRowBuilder().addComponents(genderInput),
      new ActionRowBuilder().addComponents(languageInput)
    );

    try {
      // Panggil modal secepat mungkin tanpa respon awal
      await interaction.showModal(modalPart1);
    } catch (error) {
      console.error("Error in execute() of introduction:", error);
    }
  },
  // Handler untuk modal submit (baik Part 1 maupun Part 2)
  async modalSubmit(interaction, client) {
    if (interaction.customId === 'introductionModalPart1') {
      // Ambil data Part 1
      const name = interaction.fields.getTextInputValue('nameInput');
      const nickname = interaction.fields.getTextInputValue('nicknameInput');
      const age = interaction.fields.getTextInputValue('ageInput');
      const gender = interaction.fields.getTextInputValue('genderPronounsInput');
      const language = interaction.fields.getTextInputValue('languageInput');

      pendingIntroductions[interaction.user.id] = { name, nickname, age, gender, language };

      // Balas dengan pesan ephemeral dan tombol "Continue" untuk Modal Part 2
      const continueButton = new ButtonBuilder()
        .setCustomId('introductionNext')
        .setLabel('Continue')
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(continueButton);

      try {
        await interaction.reply({
          ephemeral: true,
          content: 'Click **Continue** to provide additional details.',
          components: [row]
        });
      } catch (error) {
        console.error("Error replying after Modal Part 1:", error);
      }
    } else if (interaction.customId === 'introductionModalPart2') {
      const partial = pendingIntroductions[interaction.user.id];
      if (!partial) {
        return interaction.reply({ ephemeral: true, content: 'No pending data found. Please run `/introduction` again.' });
      }
      const hobbies = interaction.fields.getTextInputValue('hobbiesInput');
      const extraNote = interaction.fields.getTextInputValue('extraNoteInput');

      const fullData = {
        ...partial,
        hobbies,
        extraNote,
        timestamp: new Date().toISOString()
      };

      introductions[interaction.user.id] = fullData;
      saveIntroductions();
      delete pendingIntroductions[interaction.user.id];

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Member Introduction')
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**Name:** ${fullData.name}\n` +
          `**Nickname:** ${fullData.nickname}\n` +
          `**Age:** ${fullData.age}\n` +
          `**Gender & Pronouns:** ${fullData.gender}\n` +
          `**Language:** ${fullData.language}\n` +
          `**Hobbies:** ${fullData.hobbies}\n` +
          (fullData.extraNote ? `**Extra Note:** ${fullData.extraNote}` : '')
        )
        .setFooter({ text: `Introduction by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      try {
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error replying after Modal Part 2:", error);
      }
    }
  },
  // Handler untuk button interaksi (untuk melanjutkan ke Modal Part 2)
  async buttonHandler(interaction, client) {
    if (interaction.customId === 'introductionNext') {
      const modalPart2 = new ModalBuilder()
        .setCustomId('introductionModalPart2')
        .setTitle('Introduction - Part 2');

      const hobbiesInput = new TextInputBuilder()
        .setCustomId('hobbiesInput')
        .setLabel('Hobbies')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter your hobbies')
        .setRequired(true);

      const extraNoteInput = new TextInputBuilder()
        .setCustomId('extraNoteInput')
        .setLabel('Extra Note (Optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Any additional notes')
        .setRequired(false);

      modalPart2.addComponents(
        new ActionRowBuilder().addComponents(hobbiesInput),
        new ActionRowBuilder().addComponents(extraNoteInput)
      );

      try {
        await interaction.showModal(modalPart2);
      } catch (error) {
        console.error("Error in buttonHandler of introduction:", error);
        try {
          await interaction.reply({
            ephemeral: true,
            content: 'Your interaction has expired. Please run `/introduction` again.'
          });
        } catch (err) {
          console.error("Error sending fallback reply in introduction buttonHandler:", err);
        }
      }
    }
  }
};
