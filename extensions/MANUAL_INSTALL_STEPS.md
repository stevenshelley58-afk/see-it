# Manual Installation - No App Needed! 🚀

Want to add the button to your store RIGHT NOW without creating a Shopify app? Here's how:

## Step-by-Step Instructions

### Step 1: Copy the Snippet Code

1. Open `extensions/manual-install-snippet.liquid`
2. Copy the entire file contents

### Step 2: Create Snippet in Your Theme

1. Go to your Shopify admin
2. **Online Store** → **Themes**
3. Click **Actions** → **Edit code**
4. In the left sidebar, click **Snippets**
5. Click **Add a new snippet**
6. Name it: `see-it-button`
7. Paste the code you copied
8. Click **Save**

### Step 3: Update App URL

In the snippet you just created, find this line:

```liquid
assign app_url = 'https://your-app.vercel.app'
```

Change it to your actual deployed app URL. For example:
- If deployed to Vercel: `https://see-it.vercel.app`
- If local testing: `http://localhost:3000`
- Your custom domain: `https://seeit.yourdomain.com`

### Step 4: Add to Product Template

1. Still in **Edit code**
2. Click **Templates** → `product.liquid` (or your product template)
3. Find where you want the button (usually near the "Add to Cart" button)
4. Add this line:

```liquid
{% render 'see-it-button' %}
```

**Example placement:**

```liquid
<div class="product-form">
  <button type="submit" name="add">Add to Cart</button>
  
  {% comment %} Add See It button here {% endcomment %}
  {% render 'see-it-button' %}
</div>
```

5. Click **Save**

### Step 5: Test It!

1. Go to any product page on your store
2. You should see the "See It In Your Home" button
3. Click it - your modal should open!

---

## Customization

Want to customize the button? Edit the snippet:

### Change Button Text

Find:
```liquid
See It In Your Home
```

Change to whatever you want:
```liquid
Visualize in Your Space
```

### Change Button Color

Find:
```liquid
background-color: #000000;
```

Change to any color:
```liquid
background-color: #ff6b6b;  /* Red */
background-color: #4ecdc4;  /* Teal */
background-color: #45b7d1;  /* Blue */
```

### Change Button Size

Find:
```liquid
padding: 12px 24px;
font-size: 16px;
```

Make it bigger:
```liquid
padding: 16px 32px;
font-size: 18px;
```

Or smaller:
```liquid
padding: 10px 20px;
font-size: 14px;
```

### Change Alignment

Find:
```liquid
text-align: center;
```

Change to:
```liquid
text-align: left;   /* Left align */
text-align: right; /* Right align */
```

---

## Troubleshooting

### Button Doesn't Appear

- ✅ Check you added `{% render 'see-it-button' %}` to product template
- ✅ Check snippet is saved correctly
- ✅ Refresh the product page

### Modal Doesn't Open

- ✅ Check app URL is correct in snippet
- ✅ Check browser allows popups
- ✅ Check browser console for errors
- ✅ Make sure your app is running/deployed

### Wrong Product Data

- ✅ Check product template has access to `product` object
- ✅ Check app reads query parameters correctly

---

## What This Does

When a customer clicks the button:

1. Opens your app in a popup window (420x800px)
2. Passes product data:
   - `productId` - Product ID
   - `variantId` - Selected variant ID  
   - `productTitle` - Product title
   - `locale` - Store locale
   - `shop` - Shop domain

3. Your app reads these from URL and shows the preview modal

---

## Next Steps

Once this is working:

1. **Test with real products** - Make sure metafields are set up
2. **Customize styling** - Match your store's design
3. **Test on mobile** - Make sure it works on phones
4. **Iterate** - Improve based on feedback

When you're ready for App Store, you can create the proper Theme App Extension!

---

## Quick Copy-Paste Version

If you just want the minimal code:

```liquid
{% liquid
  assign product_id = product.id | split: '/' | last
  assign variant_id = product.selected_or_first_available_variant.id | split: '/' | last
  assign app_url = 'https://your-app.vercel.app'  # UPDATE THIS!
  assign modal_url = app_url | append: '?productId=' | append: product_id | append: '&variantId=' | append: variant_id
%}

<button onclick="window.open('{{ modal_url }}', 'SeeIt', 'width=420,height=800')" style="background:#000;color:#fff;border:none;padding:12px 24px;border-radius:4px;cursor:pointer;margin:20px 0;">
  See It In Your Home
</button>
```

Add this directly to your product template where you want the button!

---

**That's it!** You now have the button working on your store without needing a Shopify app. 🎉
