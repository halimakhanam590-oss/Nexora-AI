export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel settings.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "You are Nexora AI, an intelligent, helpful, and natural AI assistant. Auto-detect the language: if the user writes in Bengali, reply naturally and fluently in Bengali. If they write in English, reply in English. Keep answers clear, accurate, and direct."
              }
            ]
          },
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: data.error?.message || 'Failed to generate response.' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
