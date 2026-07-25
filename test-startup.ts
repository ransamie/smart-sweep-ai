import { getStartupItems } from './electron/startup';

async function test() {
  try {
    const items = await getStartupItems();
    console.log('ITEMS:', JSON.stringify(items, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();
