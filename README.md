# Flip & Rotate

A small Ink OS app for rotating images in 90-degree steps, flipping horizontally or vertically, undoing edits, and saving a PNG copy to Ink OS. Edits preview immediately, retain transparency, and always render from the original decoded image.

## Install

Requires a running [Ink OS](https://github.com/siliconjungle/ink-os-platform) instance and its selected CLI connection. Use Node.js 24 or later.

```sh
git clone https://github.com/siliconjungle/ink-app-flip-rotate.git
cd ink-app-flip-rotate
npm test
ink-os deploy .
```

No dependency installation or build step is required. The CLI deploys committed source.

## Use

Open from the app launcher, choose **Open from Ink…**, upload an image, or right-click an image in Ink OS → **Open with… → Flip & Rotate**. You can also drop an image onto the app window.

Use **Rotate left**, **Rotate right**, **Flip horizontal**, or **Flip vertical**. **Undo** restores the previous operation; **Reset** restores the original orientation. Choose a name and **Save copy** (or Cmd/Ctrl+S). **Open saved image** opens the result with its default image app.

## Behavior and limits

- Saves a new PNG file in Ink OS; the original file is preserved. Transparency is retained.
- Processing happens locally in the app window. No external image API or credential is required.
- Accepts PNG, JPEG, WebP, AVIF, GIF and BMP when supported by the browser. Animated inputs use their first frame.
- Normalizes EXIF orientation on decode. Rotation and flip transforms are composed before export, avoiding repeated encode/decode losses.
- Maximum 24 MiB input/output and 16 million decoded pixels. Unsaved transforms remain in the open window and are discarded when it closes.
- The bundled Ink OS SDK and styles are copied from the existing MIT-licensed Ink OS Image Converter app. Font notices remain in `web/styles/fonts/OFL.txt`.

## Development

`npm test` checks rotation direction, transform composition, inverse operations, image bounds, and safe output names. `npm run check` checks JavaScript syntax.

## License

MIT. Bundled components retain their own notices.

## Quick preview

Displays supported files without starting the normal editing workflow. Ink OS can select this reader through `desktop.preview.fileTypes`, independently of Open with. Space opens the temporary preview from a selection; Escape or Space dismisses it, and arrow keys browse the supplied item order.
