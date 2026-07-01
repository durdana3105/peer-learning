const { chromium } = require('playwright');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.log('BROWSER_CONSOLE_ERROR:', text);
      errors.push(`Console Error: ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER_PAGE_ERROR:', error.message);
    errors.push(`Page Error: ${error.message}`);
  });

  const url = process.env.TEST_URL || 'http://localhost:8080/learner-dashboard';

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
  } catch (e) {
    console.log('Goto Error:', e.message);
    errors.push(`Navigation Error: ${e.message}`);
  }
  
  try {
    await page.waitForLoadState('networkidle');
  } catch (e) {
    errors.push(`Wait Error: ${e.message}`);
  }
  
  await browser.close();

  console.log('\n--- Test Summary ---');
  console.log(`Total Errors Found: ${errors.length}`);
  
  if (errors.length > 0) {
    console.error('Errors details:');
    errors.forEach(err => console.error(`- ${err}`));
    process.exit(1);
  } else {
    console.log('No errors detected.');
    process.exit(0);
  }
})();
