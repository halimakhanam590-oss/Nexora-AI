export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel.' });
  }

  try {
    const prompt = `System instruction: You are Nexora AI, a smart, versatile, and friendly personal assistant. Automatically detect the user's language: if they write in Bengali, reply naturally and fluently in Bengali. If they write in English, reply in English. Keep your answers clear, concise, and direct.\n\nUser: ${message}`;

    // গুগলের রিকমেন্ড করা লেটেস্ট মডেল: gemini-3.6-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: data.error?.message || 'Could not generate reply.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
