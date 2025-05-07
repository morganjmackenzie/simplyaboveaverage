# simplyaboveaverage — Full Pipeline Overview

**simplyaboveaverage** is a fashion-tech platform helping people with extended sizes find clothes that fit. This repository contains the full backend and frontend pipeline used to source product data, clean and structure it, store it in a database, and deliver it to users through a filtered shopping experience.

---

## 🧭 Repo Structure

This monorepo includes four main components, used in the following order:

---

### 1. 🛒 `shopify_scraper/`
> **Purpose:** Collect raw product data from Shopify-based brand websites.

- Built using **Scrapy**.
- Outputs JSON data to an S3 bucket (`raw-shopify/`).
- Scrapes product details including titles, variants, prices, and availability.

**Usage:**  
Run the spiders locally or via ScrapyCloud to send fresh data to S3.

---

### 2. 🧼 `flatten_lambda/`
> **Purpose:** Clean and flatten raw Shopify data.

- AWS Lambda function triggered by new files in `raw-shopify/`.
- Maps sizes, colors, lengths, and inseams.
- Outputs flattened JSON to a separate S3 path (`cleaned-shopify/`).

**Usage:**  
Upload raw data to `raw-shopify/` → Lambda automatically processes and saves clean JSON.

---

### 3. 🔄 `simplyaboveaverage-data-pipeline/`
> **Purpose:** Send cleaned data to Supabase (or Weaviate, if configured).

- Reads cleaned JSON from S3.
- Uploads structured product data to a `products` table in Supabase.
- Can be triggered manually or automated via a scheduled Lambda or script.

**Usage:**  
Run `upload_to_supabase.py` after confirming cleaned data is ready.

---

### 4. 🛒 `simply-ui-multicart/`
> **Purpose:** Frontend web app for users to browse, filter, and shop clothing that fits them.

- Built with **Next.js** and **Tailwind CSS**.
- Connects to Supabase to pull product data.
- Features filters for size, inseam, color, and product type.
- Users can create prefilled carts on the site and go directly to checkout on the brand's website.
- Wishlist functionality coming soon. 



**Usage:**  
Run the app locally with:

```bash
cd simply-ui-multicart
npm install
npm run dev
