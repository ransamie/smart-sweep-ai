const { app } = require('electron');
const { getStartupItems } = require('./dist-electron/startup.js');
const fs = require('fs');

app.whenReady().then(async () => {
  try {
    console.log('Running getStartupItems in Electron...');
    const items = await getStartupItems();
    fs.writeFileSync('electron-test-out.json', JSON.stringify({ items }, null, 2));
    console.log('Done, wrote items');
  } catch (e) {
    fs.writeFileSync('electron-test-out.json', JSON.stringify({ error: String(e), stack: e.stack }, null, 2));
  }
  app.quit();
});
