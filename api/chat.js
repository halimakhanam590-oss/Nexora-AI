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
    // ১. আপনার API Key-এর আন্ডারে চালু থাকা মডেলের লিস্ট আনা
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsRes.json();

    if (modelsData.error) {
      return res.status(500).json({ error: modelsData.error.message });
    }

    // ২. চ্যাট সাপোর্ট করা মডেল ফিল্টার করা
    const validModels = (modelsData.models || []).filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    if (validModels.length === 0) {
      return res.status(500).json({ error: 'No compatible model found for this key.' });
    }

    // ৩. সেরা মডেল বাছাই (Flash থাকলে আগে নেবে, নয়তো লিস্টের প্রথমটি)
    const selectedModel = validModels.find(m => m.name.includes('flash')) || validModels[0];

    // ৪. মেসেজ পাঠানো
    const prompt = `System instruction: You are Nexora AI, a smart, versatile, and friendly personal assistant. Automatically detect the user's language: if they write in Bengali, reply naturally and fluently in Bengali. If they write in English, reply in English. Keep your answers clear, concise, and direct.\n\nUser: ${message}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel.name}:generateContent?key=${apiKey}`, {
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
