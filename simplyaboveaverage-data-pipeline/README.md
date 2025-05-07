# simplyaboveaverage-data-pipeline

This repo contains the AWS Lambda function, data formatting logic, and Supabase integration for pushing cleaned Shopify product data into the `products` table in Supabase.

---

## 🧠 Overview

This pipeline:
1. Scrapes product data from Shopify stores (via ScrapyCloud).
2. Uploads cleaned JSON to an S3 bucket.
3. Triggers an AWS Lambda function to:
   - Download the cleaned file from S3
   - Format each product
   - Send it to Supabase via REST API

---

## 📁 Folder Structure

simplyaboveaverage-data-pipeline/
├── lambda/ # Lambda function & dependencies
│ ├── lambda_function.py
│ ├── requirements.txt
│ └── build/ # Zipped Lambda code (for deployment)
├── test_data/ # Example JSON to simulate S3 input
├── scripts/ # Optional test runner for local simulation
├── env/ # Environment variables (not committed)
│ └── .env.local
├── README.md # You're here!

---

## 🔧 Setup Instructions

### 1. Install Dependencies (locally for testing)

```bash
pip install -r lambda/requirements.txt

2. Set Environment Variables
Create a .env.local file in env/ with:

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-service-role-key

3. Run Locally (optional)
python scripts/local_test_runner.py

4. Deploy to AWS Lambda
Zip contents of lambda/ (excluding /build)

Upload to AWS Lambda and configure it to trigger on new S3 uploads

📥 Supabase Table Schema
Target table: products

| Column          | Type    |
| --------------- | ------- |
| `id`            | uuid    |
| `product_title` | text    |
| `vendor`        | text    |
| `price`         | numeric |
| `size`          | text    |
| `color`         | text    |
| `length`        | text    |
| `inseam`        | text    |
| `available`     | boolean |
| `image_url`     | text    |
| `product_url`   | text    |
| `variant_title` | text    |
| `description`   | text    |


🚀 To-Do / Improvements
 Add retry logic or batch inserts

 Add logging to CloudWatch

 Add support for partial updates


 // There are some additions I would add here like: 
 1. open supabase, go to your project, open the table editor, create a new table called products. (use the table above for columns) 
 2. disable RLS because inserting data via AWS Lambda, not a Supabase-authenticated client. If RLS enbaled with no polify, Supabase will block all inserts, reads, adn updates by default — including the Lambda function. (later when showing users their trnasaction history, might need to find a solution that enables RLS so that we can tie product rows to logged-in users)
 3. set up folders on laptop, follow structure above. next, create files. 