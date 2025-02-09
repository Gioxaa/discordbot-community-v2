const fs = require('fs');
const path = require('path');

const giftDBPath = path.join(__dirname, '../data/giftDatabase.json');

function readGiftDatabase() {
  try {
    if (!fs.existsSync(giftDBPath)) {
      return { gifts: [] };
    }
    return JSON.parse(fs.readFileSync(giftDBPath, 'utf8'));
  } catch (error) {
    console.error("Error reading gift database:", error);
    return { gifts: [] };
  }
}

function writeGiftDatabase(db) {
  try {
    fs.writeFileSync(giftDBPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error writing gift database:", error);
  }
}

module.exports = { readGiftDatabase, writeGiftDatabase };
