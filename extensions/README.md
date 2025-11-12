# Theme App Extensions

This directory contains theme app extensions for the See It app.

## Structure

```
extensions/
└── see-it-button/
    ├── shopify.extension.toml    # Extension configuration
    ├── blocks/
    │   └── see-it-button.liquid   # Button block
    ├── assets/
    │   └── see-it-button.css      # Styles
    └── README.md                  # Extension docs
```

## Deploying Extensions

Extensions are automatically included when you deploy your app using Shopify CLI:

```bash
shopify app deploy
```

Or when you push to your hosting platform (Vercel, etc.), make sure your build process includes the `extensions/` directory.

## Testing

To test extensions locally:

```bash
# Using Shopify CLI
shopify app dev

# This will:
# - Start your app
# - Make extensions available in Theme Editor
# - Allow you to test on a development store
```

## Adding New Extensions

To add more extensions:

1. Create a new folder in `extensions/`
2. Add `shopify.extension.toml` config file
3. Add blocks/assets as needed
4. Deploy your app

## Documentation

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Extension Points](https://shopify.dev/docs/apps/online-store/theme-app-extensions/getting-started)
- [Block Schema](https://shopify.dev/docs/apps/online-store/theme-app-extensions/blocks)
