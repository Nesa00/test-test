import requests
from bs4 import BeautifulSoup
import re
import os

os.environ['HTTP_PROXY'] = 'http://10.82.35.230:3128'
os.environ['HTTPS_PROXY'] = 'http://10.82.35.230:3128'

url = "https://www.kaloricketabulky.cz/potraviny/banan"

r = requests.get(url)
soup = BeautifulSoup(r.text, "html.parser")

# Get all text, normalize spaces
text = soup.get_text(" ", strip=True)
text = re.sub(r"\s+", " ", text)

# Debug: print a snippet of the text to help with regex tuning
print(text[:1000])

# Improved regex patterns: allow for any non-digit chars between label and value, and optional spaces
kcal = re.search(r"(\d+)\s*kcal", text)
protein = re.search(r"Bílkoviny[^\d]*([\d,]+)\s*g", text)
carbs = re.search(r"Sacharidy[^\d]*([\d,]+)\s*g", text)
fat = re.search(r"Tuky[^\d]*([\d,]+)\s*g", text)
amount = re.search(r"(\d+)\s*g", text)  # Usually 100 g

# Print the text around the kcal match for further debugging
if kcal:
    start = max(0, kcal.start() - 100)
    end = min(len(text), kcal.end() + 100)
    # print("\n...context around kcal...\n", text[start:end], "\n...")

def parse_val(match):
    return float(match.group(1).replace(',', '.')) if match else None

print({
    "amount": parse_val(amount),
    "unit": "g",
    "kcal": int(kcal.group(1)) if kcal else None,
    "proteins": parse_val(protein),
    "carbohydrates": parse_val(carbs),
    "fats": parse_val(fat),
})