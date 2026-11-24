// Exercise Expo's Android adaptive-icon generator without Gradle.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { setIconAsync } = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');

(async () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, '.expo', 'icon-verification');
  const config = JSON.parse(await fs.readFile(path.join(root, 'app.json'), 'utf8')).expo;
  const adaptive = config.android.adaptiveIcon;
  await setIconAsync(output, {
    icon: path.resolve(root, config.android.icon),
    foregroundImage: path.resolve(root, adaptive.foregroundImage),
    backgroundImage: path.resolve(root, adaptive.backgroundImage),
    monochromeImage: path.resolve(root, adaptive.monochromeImage),
    backgroundColor: adaptive.backgroundColor,
    isAdaptive: true,
  });
  const res = path.join(output, 'android/app/src/main/res');
  for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const file = path.join(res, 'mipmap-anydpi-v26', name);
    const xml = await fs.readFile(file, 'utf8');
    assert.equal((xml.match(/<inset /g) || []).length, 0);
    assert.ok(xml.includes('<background android:drawable="@mipmap/ic_launcher_background"/>'));
    assert.ok(xml.includes('<foreground android:drawable="@mipmap/ic_launcher_foreground"/>'));
    assert.ok(xml.includes('<monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>'));
  }
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground', 'ic_launcher_background', 'ic_launcher_monochrome']) {
      assert.ok((await fs.stat(path.join(res, `mipmap-${density}`, `${name}.webp`))).size > 0);
    }
  }
  console.log('PASS: separate background, transparent safe foreground, monochrome, and 5 icon densities');
  console.log(res);
})().catch((error) => { console.error(error); process.exitCode = 1; });
