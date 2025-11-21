import nanoBananaProTexts from './config/nanoBananaProTexts.js';
import shoubanTexts from './config/shouban.js';

export default function getLocalizedTexts() {
  const appType = process.env.APP_TYPE || 'default'; // 默认为nano-banana-pro生成
console.log('appType', appType)
  switch(appType) {
    case 'shouban':
      return shoubanTexts;
    default:
      return nanoBananaProTexts;
  }
}
