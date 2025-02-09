const fs = require('fs');

const readDatabase = () => {
  if (!fs.existsSync('./rolesDatabase.json')) {
    fs.writeFileSync('./rolesDatabase.json', JSON.stringify({ roles: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync('./rolesDatabase.json', 'utf-8'));
};

const writeDatabase = (data) => {
  fs.writeFileSync('./rolesDatabase.json', JSON.stringify(data, null, 2));
};

module.exports = { readDatabase, writeDatabase };