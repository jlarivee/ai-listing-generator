export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, images, image, prompt } = req.body;

    if (!apiKey || (!images && !image) || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Handle both single image (legacy) and multiple images
    let messageContent = [];
    
    if (images && Array.isArray(images)) {
      // Multiple images
      messageContent = [...images, { type: 'text', text: prompt }];
    } else if (image) {
      // Single image (legacy support)
      messageContent = [{
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.type,
          data: image.data
        }
      }, {
        type: 'text',
        text: prompt
      }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: messageContent
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'API request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}