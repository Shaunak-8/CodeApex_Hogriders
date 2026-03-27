import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

print(f"Testing model: {model_name}")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello, are you working? Respond with 'YES'.")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
