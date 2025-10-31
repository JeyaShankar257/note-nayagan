export async function translateWithGemini({
  text,
  targetLang,
  apiKey
}: {
  text: string;
  targetLang: string;
  apiKey: string;
}): Promise<string> {
  // Gemini API expects a prompt for translation
  const prompt = `Translate the following text to ${targetLang}:\n${text}`;

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
    throw new Error("Translation failed");
  }
  const data = await response.json();
  // Extract the translated text from the Gemini API response
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}
