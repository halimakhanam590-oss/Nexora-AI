export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel.' });
  }

  try {
    const systemPrompt = `You are Nexora AI, a world-class, intelligent, and highly engaging conversational assistant like ChatGPT and Gemini.

Strict Guidelines:
1. Tone & Formatting: Warm, modern, and engaging. Naturally include relevant emojis (✨, 💡, 🚀, 📌).
2. Comprehensive Depth: Provide clear, structured, and insightful answers using clean Markdown (bolding, bullet points, tables, and code formatting).
3. Vision & Image Analysis: If the user provides an image, examine it thoroughly (solve math/assignments, critique designs, extract text, or describe objects in detail).
4. Language: If the user communicates in Bengali or Banglish, answer fully in natural, fluent Bengali. If in English, answer in English.
5. Engagement: Always end your response with an intriguing thought, follow-up angle, or question to spark deeper curiosity.`;

    const contents = [];

    // আগের চ্যাট মেমোরি
    if (Array.isArray(history)) {
      history.forEach(turn => {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }]
        });
      });
    }

    // বর্তমান মেসেজ ও ছবি সংযুক্তি
    const currentParts = [];
    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      });
    }
    
    currentParts.push({ text: message || "এই ছবিটি বিশ্লেষণ করে বিস্তারিত বুঝিয়ে বলো।" });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents
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
