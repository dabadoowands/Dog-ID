// Serverless function (Vercel). Keeps the Anthropic API key server-side,
// never exposed to the browser.
//
// Required env var (set in Vercel dashboard, NOT in code):
//   ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mediaType } = req.body || {};

  if (!image || !mediaType) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mediaType)) {
    return res.status(400).json({ error: 'Unsupported image type' });
  }

  const systemPrompt = `You are a canine breed identification expert. Look at the dog photo and respond with ONLY a raw JSON object (no markdown fences, no preamble) with exactly these string fields:

{
  "breed": "Most likely breed or breed mix, e.g. 'Labrador Retriever / German Shepherd mix'",
  "confidence": "One short sentence on how confident this read is and why (coat, build, ear shape, etc.)",
  "characteristics": "2-3 sentences on temperament and typical traits of this breed/mix",
  "grooming": "2-3 sentences on coat type, brushing frequency, bathing, shedding",
  "exercise": "2-3 sentences on daily exercise needs and ideal activities",
  "lifespan": "One short sentence with typical lifespan range and any relevant health notes",
  "training": "2-3 sentences with specific, practical training tips suited to this breed/mix's temperament"
}

If the photo does not clearly show a dog, set "breed" to "No dog detected" and leave other fields as a brief explanation. Never include text outside the JSON object.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: image }
              },
              { type: 'text', text: 'Identify this dog and generate the profile JSON.' }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Upstream analysis failed' });
    }

    const data = await response.json();
    const textBlock = data.content.find((c) => c.type === 'text');
    if (!textBlock) throw new Error('No text in response');

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: 'Something went wrong analyzing the photo' });
  }
}
