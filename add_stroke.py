from PIL import Image, ImageFilter
import sys
import os

def add_stroke(input_path, output_path, stroke_width=4, stroke_color=(0,0,0,255)):
    # Open image
    img = Image.open(input_path).convert("RGBA")
    
    # Extract alpha channel
    alpha = img.split()[-1]
    
    # Apply MaxFilter to dilate the alpha channel
    # MaxFilter takes a size, radius = size//2. So size 9 -> radius 4
    dilated_alpha = alpha.filter(ImageFilter.MaxFilter(size=stroke_width*2 + 1))
    
    # Create a solid color image for the stroke
    stroke_img = Image.new("RGBA", img.size, stroke_color)
    
    # Apply the dilated alpha to the stroke image
    stroke_img.putalpha(dilated_alpha)
    
    # Paste original image on top
    # The first argument is the image to paste, the second is position, third is mask
    stroke_img.paste(img, (0, 0), img)
    
    # Save the result
    stroke_img.save(output_path)
    print(f"Saved outlined image to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_stroke.py <input> <output>")
        sys.exit(1)
        
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    
    if not os.path.exists(in_file):
        print(f"Error: {in_file} not found")
        sys.exit(1)
        
    add_stroke(in_file, out_file, stroke_width=6, stroke_color=(0,0,0,255))
