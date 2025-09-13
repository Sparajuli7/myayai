# MyAyAI Extension Build System

A comprehensive build system for creating browser extension packages from a single codebase.

## Overview

This build system supports:

- **Chrome/Edge/Brave/Opera** (Manifest V3)
- **Firefox** (Manifest V2 with V3 preparation)  
- **Safari** (Future support - structure ready)

## Quick Start

```bash
# Install dependencies
npm install

# Build all browser versions
npm run build:all

# Create distribution packages
npm run pack:all
```

## Build Commands

### Development
```bash
npm run dev              # Development build with watch mode
npm run dev:hot          # Development server with hot reload
```

### Production Builds
```bash
npm run build:chrome     # Chrome/Chromium browsers
npm run build:firefox    # Firefox 
npm run build:edge       # Microsoft Edge
npm run build:brave      # Brave Browser
npm run build:opera      # Opera Browser
npm run build:safari     # Safari (experimental)
npm run build:all        # All browsers
```

### Packaging
```bash
npm run pack             # Pack all built extensions
npm run pack:chrome      # Pack Chrome version only
npm run pack:firefox     # Pack Firefox version only
npm run pack:all         # Build and pack everything
```

### Quality & Testing
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run test             # Run tests
npm run size-check       # Check bundle sizes
npm run analyze          # Analyze bundle composition
```

### Firefox-Specific
```bash
npm run validate:firefox # Validate Firefox extension
npm run serve:firefox    # Test Firefox extension locally
```

## Output Structure

```
dist/
├── chrome/              # Chrome Web Store ready
├── firefox/             # Firefox AMO ready  
├── edge/                # Edge Add-ons ready
├── brave/               # Brave ready (same as Chrome)
├── opera/               # Opera ready (same as Chrome)
├── safari/              # Safari ready (future)
└── packages/            # Distribution zip files
    ├── myayai-chrome-v1.0.0.zip
    ├── myayai-firefox-v1.0.0.zip
    └── ...
```

## Key Features

### Webpack Configuration
- **Environment-specific builds** - Different configs per browser
- **Code splitting** - Optimized bundle sizes
- **Minification** - Production-ready compression  
- **Source maps** - Development debugging support
- **Hot reload** - Fast development iteration
- **Asset optimization** - Images, fonts, sounds

### Manifest Transformation
- **Automatic V2/V3 conversion** - Based on target browser
- **Permission mapping** - Correct permissions per browser
- **API compatibility** - Background scripts vs service workers

### Browser API Polyfills
- **Cross-browser compatibility** - Single codebase for all browsers
- **Promise-based APIs** - Modern async/await support
- **Automatic fallbacks** - Graceful degradation

## Browser-Specific Considerations

### Chrome/Edge/Brave/Opera (Manifest V3)
- Uses `chrome.action` instead of `chrome.browserAction`
- Service worker instead of background scripts
- Separate host_permissions from regular permissions
- More restrictive CSP

### Firefox (Manifest V2)  
- Uses `browser.browserAction` instead of `browser.action`
- Background scripts instead of service worker
- Combined permissions array
- Different web_accessible_resources format
- Requires `applications.gecko` section

### Safari (Future)
- Will use Manifest V3 like Chrome
- May require additional Safari-specific configuration
- Native app wrapper considerations

## File Structure

```
build/
├── webpack.config.js         # Main webpack configuration
└── manifest-transformer.js   # Manifest V2/V3 converter

scripts/
├── build-all.js             # Multi-browser build orchestrator
└── pack-extension.js        # Distribution package creator

utils/
└── browser-polyfill.js      # Cross-browser API compatibility

manifest_v2.json             # Firefox manifest template
manifest_v3.json             # Chrome manifest template
```

## Customization

### Adding New Browsers
1. Add browser config to `scripts/build-all.js`
2. Update manifest transformer in `build/manifest-transformer.js`  
3. Add browser-specific webpack configuration if needed
4. Update package.json scripts

### Modifying Build Process
- **Webpack config**: `build/webpack.config.js`
- **Manifest transformation**: `build/manifest-transformer.js`
- **Build orchestration**: `scripts/build-all.js`
- **Packaging**: `scripts/pack-extension.js`

### Environment Variables
- `BROWSER`: Target browser (chrome, firefox, safari)
- `NODE_ENV`: development/production
- `MANIFEST_VERSION`: 2 or 3

## Store Submission

### Chrome Web Store
- Upload: `dist/packages/myayai-chrome-v*.zip`
- Max size: 128MB
- Review time: 1-3 days

### Firefox Add-ons (AMO)  
- Upload: `dist/packages/myayai-firefox-v*.zip`
- Max size: 200MB  
- Review time: 1-7 days
- Source code may be required if minified

### Microsoft Edge Add-ons
- Upload: `dist/packages/myayai-edge-v*.zip` 
- Max size: 128MB
- Review time: 1-7 days

### Opera Add-ons
- Upload: `dist/packages/myayai-opera-v*.zip`
- Max size: 128MB
- Review time: 1-3 days

## Troubleshooting

### Common Issues

**Build fails with module not found**
```bash
npm install
```

**Firefox validation errors**  
```bash
npm run validate:firefox
```

**Bundle too large**
```bash
npm run analyze
npm run size-check
```

**Manifest issues**
- Check `build/manifest-transformer.js` for browser-specific transforms
- Validate against manifest schema for target browser

### Debug Mode
```bash
# Verbose build output
npm run build:all -- --verbose

# Debug specific browser
npm run build:firefox -- --verbose
```

## Contributing

When adding features that affect the build system:

1. Update webpack configuration if needed
2. Add browser-specific handling in manifest transformer  
3. Update build scripts for new requirements
4. Test across all supported browsers
5. Update this documentation

## Support

- Chrome Extension API: https://developer.chrome.com/docs/extensions/
- Firefox Extension API: https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/
- Webpack Documentation: https://webpack.js.org/
