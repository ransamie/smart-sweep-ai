const registryJs = require('registry-js');
const { enumerateValues, HKEY } = registryJs;

try {
  const values = enumerateValues(HKEY.HKEY_CURRENT_USER, '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run');
  console.log(values);
} catch (e) {
  console.error(e);
}
