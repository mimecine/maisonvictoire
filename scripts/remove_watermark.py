# Remove Watermark from Images using Inpainting
# This script processes images in the 'inputs' folder, removes the watermark using a provided mask,
# and saves the results in the 'outputs' folder.
# Requirements: OpenCV, NumPy
# Usage: Place your images in 'inputs' and the watermark mask as 'watermark_mask.png', then run the script.
# Remember to activate venv: source ./bin/activate from project folder

import cv2
import numpy as np
import os
import argparse

def process_batch():
    parser = argparse.ArgumentParser(description="Multi-scale detection & watermark removal.")
    parser.add_argument("--mask", "-m", required=True, help="Grayscale mask (white pattern on black).")
    parser.add_argument("--output", "-o", required=True, help="Output directory.")
    parser.add_argument("input_files", nargs='+', help="Input images.")
    args = parser.parse_args()

    # Load mask as the template
    template = cv2.imread(args.mask, 0)
    if template is None: return
    
    if not os.path.exists(args.output): os.makedirs(args.output)

    for img_path in args.input_files:
        img = cv2.imread(img_path)
        if img is None: continue
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        found = None

        # 1. Multi-scale detection: Loop through possible sizes of the watermark
        # Searching from 40% to 150% of the original mask size
        for scale in np.linspace(0.4, 1.5, 20):
            resized_w = int(template.shape[1] * scale)
            resized_h = int(template.shape[0] * scale)
            
            if resized_w > img.shape[1] or resized_h > img.shape[0]:
                continue

            resized_t = cv2.resize(template, (resized_w, resized_h))
            
            # TM_CCOEFF_NORMED is robust for semi-transparent white text
            res = cv2.matchTemplate(gray, resized_t, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, max_loc = cv2.minMaxLoc(res)

            # Keep track of the best match found across all scales
            if found is None or max_val > found[0]:
                found = (max_val, max_loc, scale)

        # 2. Threshold check: Only process if match is convincing (e.g., > 0.6)
        # This handles your "sometimes there is no watermark" requirement
        if found and found[0] > 0.6:
            max_val, max_loc, scale = found
            
            # Recreate the best-fitting mask
            best_w = int(template.shape[1] * scale)
            best_h = int(template.shape[0] * scale)
            best_mask = cv2.resize(template, (best_w, best_h))

            # Apply mask to a blank canvas the size of the target image
            full_mask = np.zeros(img.shape[:2], dtype="uint8")
            full_mask[max_loc[1]:max_loc[1]+best_h, max_loc[0]:max_loc[0]+best_w] = best_mask

            # 3. Inpaint
            result = cv2.inpaint(img, full_mask, 5, cv2.INPAINT_TELEA)
            print(f"Detected & Removed: {os.path.basename(img_path)} (Confidence: {max_val:.2f})")
        else:
            result = img
            print(f"Skipped (No watermark found): {os.path.basename(img_path)}")

        cv2.imwrite(os.path.join(args.output, os.path.basename(img_path)), result)

if __name__ == "__main__":
    process_batch()
