require('dotenv').config();

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Bot online sebagai ${client.user.tag}`);

    // Set custom avatar jika AVATAR_URL disediakan di .env
    if (process.env.AVATAR_URL) {
      try {
        await client.user.setAvatar(process.env.AVATAR_URL);
        console.log("Avatar bot berhasil diperbarui.");
      } catch (err) {
        console.error("Gagal mengubah avatar bot:", err);
      }
    }

    // Array aktivitas (type: 0 = Playing, 2 = Listening, 3 = Watching)
    const activities = [
      { name: 'Frey Store', type: 3 },
      { name: 'Cheap Product!', type: 2 },
      { name: 'Buy? Open Ticket', type: 0 }
    ];

    // Array status (misalnya: 'online', 'idle', 'dnd', 'invisible')
    const statuses = ['idle'];

    let activityIndex = 0;
    let statusIndex = 0;

    setInterval(() => {
      try {
        client.user.setPresence({
          activities: [activities[activityIndex]],
          status: statuses[statusIndex],
        });
      } catch (err) {
        console.error("Error setting presence:", err);
      }
      activityIndex = (activityIndex + 1) % activities.length;
      statusIndex = (statusIndex + 1) % statuses.length;
    }, 3000); // Update setiap 3000 ms (3 detik)
  }
};
