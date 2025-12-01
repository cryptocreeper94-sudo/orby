#!/usr/bin/env python3
from rembg import remove
from PIL import Image
import os

input_path = "attached_assets/Screenshot_20251130_212612_Replit_1764559633798.jpg"
output_path = "client/public/orby-mascot.png"

os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(input_path, "rb") as inp:
    input_data = inp.read()

output_data = remove(input_data)

with open(output_path, "wb") as out:
    out.write(output_data)

print(f"Background removed! Saved to {output_path}")
