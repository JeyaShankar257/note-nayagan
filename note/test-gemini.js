import fetch from 'node-fetch';

async function testGeminiTranslation() {
  const apiKey = "AIzaSyDObh8JdHfsxFsBC5NN8KWj25576_c9xOc";
  const prompt = `Translate the following text to Tamil:\nHello, how are you?`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    }
  );
  if (!response.ok) {
    throw new Error("Translation failed: " + response.status);
  }
  const data = await response.json();
  console.log(data?.candidates?.[0]?.content?.parts?.[0]?.text || "No translation returned");
}

testGeminiTranslation();