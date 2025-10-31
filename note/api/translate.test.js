import fetch from 'node-fetch';
import assert from 'assert';

const BASE_URL = 'http://localhost:3001/api/translate';

async function testTranslation(text, targetLang, expected, expectedAlternatives = []) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang })
  });
  assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  assert.ok(data.translatedText, 'No translatedText in response');
  console.log(`Input: ${text} | Target: ${targetLang} | Output: ${data.translatedText}`);
  if (expectedAlternatives && expectedAlternatives.length > 0) {
    const found = expectedAlternatives.some(opt => data.translatedText.toLowerCase() === opt.toLowerCase());
    assert.ok(found, `Translation does not match any expected alternatives: ${expectedAlternatives.join(', ')}`);
  } else if (expected) {
    assert.strictEqual(data.translatedText.toLowerCase(), expected.toLowerCase(), 'Translation does not match expected');
  }
}

async function runTests() {
  await testTranslation('Hello', 'ta', 'வணக்கம்');
  await testTranslation('How are you?', 'fr');
  await testTranslation('This is a test.', 'te');
  await testTranslation('Good morning', 'es', undefined, ['Buenos días', 'Buen día']);
  console.log('All translation tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
