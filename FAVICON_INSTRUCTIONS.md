# Favicon and PWA Icons Setup Instructions

You need to create several icon files from your `biblioteca.jpg` image and place them in the `public` directory.

## Required Icon Files

Create these files from your `src/assets/images/biblioteca.jpg` image:

### Browser Favicons
- `public/favicon.ico` - 32x32 pixels (ICO format)
- `public/favicon-16x16.png` - 16x16 pixels
- `public/favicon-32x32.png` - 32x32 pixels

### Apple/iOS Icons
- `public/apple-touch-icon.png` - 180x180 pixels

### Android/PWA Icons  
- `public/android-chrome-192x192.png` - 192x192 pixels
- `public/android-chrome-512x512.png` - 512x512 pixels

## How to Create These Icons

### Option 1: Online Tools (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload your `biblioteca.jpg` file
3. Configure settings (accept defaults)
4. Download the generated files
5. Copy all files to your `public` directory

### Option 2: Manual Creation
1. Open `biblioteca.jpg` in an image editor (Photoshop, GIMP, etc.)
2. For each required size:
   - Resize the image to the specified dimensions
   - Save as PNG (or ICO for favicon.ico)
   - Name according to the list above
   - Place in the `public` directory

### Option 3: Command Line (if you have ImageMagick)
```bash
cd front/public
convert ../src/assets/images/biblioteca.jpg -resize 16x16 favicon-16x16.png
convert ../src/assets/images/biblioteca.jpg -resize 32x32 favicon-32x32.png
convert ../src/assets/images/biblioteca.jpg -resize 32x32 favicon.ico
convert ../src/assets/images/biblioteca.jpg -resize 180x180 apple-touch-icon.png
convert ../src/assets/images/biblioteca.jpg -resize 192x192 android-chrome-192x192.png
convert ../src/assets/images/biblioteca.jpg -resize 512x512 android-chrome-512x512.png
```

## After Creating the Icons

1. Place all icon files in the `front/public/` directory
2. Build your project: `npm run build`
3. Deploy to Netlify
4. Test:
   - **Browser tab**: Should show biblioteca icon instead of React logo
   - **iPhone/iPad**: "Add to Home Screen" should show biblioteca icon

## File Structure
```
front/
  public/
    favicon.ico
    favicon-16x16.png
    favicon-32x32.png
    apple-touch-icon.png
    android-chrome-192x192.png
    android-chrome-512x512.png
    manifest.json ✅ (already created)
    _redirects ✅ (already created)
```

## What's Already Done
✅ Updated `index.html` with all necessary meta tags  
✅ Created `manifest.json` for PWA functionality  
✅ Configured Apple and Android icon references  

## What You Need to Do
⚠️ Create the actual icon files from `biblioteca.jpg`  
⚠️ Place them in the `public` directory with exact names above