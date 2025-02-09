from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  extra_body={},
  model="deepseek/deepseek-r1-distill-llama-8b",
  messages=[
    {
      "role": "user",
      "content": "can u make me a simple javascript code for simple logic?"
    }
  ]
)
print(completion.choices[0].message.content)