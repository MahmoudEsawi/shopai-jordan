const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (!msg.text().includes('ERR_CONNECTION_CLOSED') && !msg.text().includes('cdn.tailwind')) {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => logs.push(`[ERROR] ${err.toString()}`));
  
  await page.goto('http://localhost:3000/#browse', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Get the session ID being used
  const sessionId = await page.evaluate(() => {
    return localStorage.getItem('mooneh_session_id') || window.sessionId || 'NOT FOUND';
  });
  console.log('Session ID:', sessionId);
  
  // Check for product cards
  const cardCount = await page.evaluate(() => document.querySelectorAll('.product-card').length);
  console.log('Product cards found:', cardCount);
  
  // Try clicking add to cart
  const btn = await page.$('.add-to-cart-action');
  if (btn) {
    const pid = await btn.evaluate(b => b.closest('.product-card')?.dataset?.productId);
    console.log('Product ID to add:', pid);
    await btn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('NO .add-to-cart-action button found!');
  }
  
  // Check cart state
  const cartState = await page.evaluate(() => {
    return {
      sideCartActive: document.getElementById('sideCart')?.classList.contains('active'),
      cartItemCount: document.getElementById('cartItemCount')?.textContent,
      cartItems: document.getElementById('cartItems')?.innerHTML?.substring(0, 500),
    };
  });
  console.log('Cart active:', cartState.sideCartActive);
  console.log('Cart item count:', cartState.cartItemCount);
  console.log('Cart items HTML snippet:', cartState.cartItems);

  // Add same product again
  const btn2 = await page.$('.add-to-cart-action');
  if (btn2) {
    console.log('\nAdding same product again...');
    await btn2.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 3000));
    const count2 = await page.evaluate(() => document.getElementById('cartItemCount')?.textContent);
    const cards2 = await page.evaluate(() => document.querySelectorAll('#cartItems .cart-item').length);
    console.log('Cart count after 2nd add:', count2);
    console.log('Number of cart item cards:', cards2, '(should be 1 card with doubled qty)');
  }

  // Test minus button
  console.log('\nTesting minus button...');
  const minusBtn = await page.$('#cartItems .qty-minus, #cartItems button[onclick*="update"]');
  if (minusBtn) {
    await minusBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 2000));
    const count3 = await page.evaluate(() => document.getElementById('cartItemCount')?.textContent);
    console.log('Cart count after minus:', count3);
  } else {
    console.log('Minus button not found in cart');
    const qtyBtns = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#cartItems button')).map(b => b.outerHTML.substring(0, 100));
    });
    console.log('Buttons in cart:', JSON.stringify(qtyBtns, null, 2));
  }
  
  // Print all logs
  console.log('\n--- CONSOLE LOGS ---');
  logs.forEach(l => console.log(l));
  
  await browser.close();
})();
