import boto3
import json
import os
import requests
import uuid
from decimal import Decimal

# ✅ Safely load environment variables with fallback error
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_API_KEY = os.environ.get('SUPABASE_KEY')  # matches AWS key
SUPABASE_TABLE = os.environ.get('SUPABASE_TABLE', 'products')  # fallback to 'products' if not set

if not SUPABASE_URL or not SUPABASE_API_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        # Extract S3 event data
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']
        print(f"✅ Lambda triggered for key: {key} in bucket: {bucket}")

        # Get and parse JSON file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8').strip()
        data = json.loads(content, parse_float=Decimal)

        print(f"📦 Retrieved {len(data)} rows from {key}")

        # Insert rows into Supabase
        inserted = 0
        for row in data:
            cleaned = prepare_row(row)
            if cleaned:
                send_to_supabase(cleaned)
                inserted += 1

        print(f"✅ Successfully inserted {inserted} rows into Supabase")

        return {
            'statusCode': 200,
            'body': f'Successfully processed {inserted} rows from {key}'
        }

    except s3.exceptions.NoSuchKey:
        print(f"❌ File not found in bucket: {key}")
        return {
            'statusCode': 404,
            'body': f'File not found: {key}'
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return {
            'statusCode': 400,
            'body': f'JSON decode error in file: {key}'
        }

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return {
            'statusCode': 500,
            'body': f'Error processing file: {key}'
        }


def prepare_row(row):
    try:
        return {
            'id': str(uuid.uuid4()),  # auto-generate UUID
            'product_id': str(row.get('product_id')),       
            'variant_id': str(row.get('variant_id')),         
            'product_title': row.get('product_title'),
            'vendor': row.get('vendor'),
            'price': float(row.get('price', 0)),
            'size': row.get('size'),
            'color': row.get('color'),
            'length': row.get('length'),
            'inseam': row.get('inseam'),  # or float(row.get('inseam')) if using numeric type
            'available': bool(row.get('available', True)),
            'image_url': row.get('image_url'),
            'product_url': row.get('product_url'),
            'variant_title': row.get('variant_title'),
            'description': row.get('description'),
            'primary_category': row.get('primary_category'),   # ✅ new
            'subcategory': row.get('subcategory'),             # ✅ new
      
        }
    except Exception as e:
        print(f"Failed to clean row: {e}")
        return None
    
def send_to_supabase(row):
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers=headers,
            json=row
        )
        if response.status_code not in [200, 201]:
            print("Insert failed:", response.status_code, response.text)
    except Exception as e:
        print("Error sending to Supabase:", e)
