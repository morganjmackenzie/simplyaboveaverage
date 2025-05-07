import boto3
import pandas as pd
import re
from bs4 import BeautifulSoup
import json
import io
import time


s3 = boto3.client("s3")


BUCKET_NAME = "simplyaboveaverage-scrapy"
INPUT_PREFIX = "raw-shopify"
OUTPUT_PREFIX = "cleaned-shopify"
OUTPUT_COLUMNS = [
   "product_id", "variant_id", "product_title", "variant_title", "description", "image_url", "category", "vendor",
   "price", "available", "size", "color", "length", "inseam", "product_url",  "primary_category", "subcategory"
]


def clean_html(text):
   return BeautifulSoup(str(text), "html.parser").get_text(separator=" ").strip()


def extract_first_image(images):
   if isinstance(images, list) and images:
       return images[0].get("src")
   return None


def extract_color_from_text(*fields):
   color_terms = ["black", "white", "red", "blue", "green", "navy", "beige", "brown", "tan", "gray", "grey", "purple", "orange", "pink", "cream", "ivory", "burgundy", "yellow", "olive"]
   for field in fields:
       if not field:
           continue
       field_str = str(field).lower()
       for color in color_terms:
           if color in field_str:
               return color.title()
   return None

def map_categories(title, product_type, tags=None):
    title = (title or "").lower()
    product_type = (product_type or "").lower()
    tags = [t.lower() for t in (tags or [])]

    combined_text = f"{title} {product_type} {' '.join(tags)}"

    categories = {
        "Shoes": {
            "Heels": ["heel", "heels", "stiletto", "kitten heel", "platform heel"],
            "Flats": ["flat", "ballet flat", "loafers"],
            "Sneakers": ["sneaker", "running shoe", "trainers"],
            "Boots": ["boot", "boots", "ankle boot", "knee boot"],
            "Sandals": ["sandal", "slides", "flip flop", "flip flops"],
            "Wide-calf boot":["wide calf boot", "wide calf boots", "wide-calf boot", "wide-calf boots"],
        },
        "Bottoms": {
            "Jeans": ["jean", "jeans", "denim", "straight jean", "flare", "bootcut", "wide leg jean", "skinny jean"],
            "Pants": ["pant", "pants", "trouser", "slacks", "chino", "cargo pant", "jogger", "leggings"],
            "Shorts": ["short", "shorts", "bermuda short", "biker short"],
            "Skirts": ["skirt", "mini skirt", "midi skirt", "maxi skirt"],
        },
        "Tops": {
            "Blouses": ["blouse", "peasant top", "ruffle top"],
            "Shirts": ["shirt", "button-down", "button up", "oxford"],
            "T-Shirts": ["t-shirt", "tee", "graphic tee", "graphic t-shirt"],
            "Tanks": ["tank", "tank top", "camisole", "cami"],
            "Sweaters": ["sweater", "pullover", "cardigan", "knit"],
        },
        "Dresses": {
            "Maxi": ["maxi dress"],
            "Mini": ["mini dress"],
            "Midi": ["midi dress"],
            "Bodycon": ["bodycon"],
            "Wrap": ["wrap dress"],
            "Slip": ["slip dress"],
            "Shirt Dress": ["shirt dress"],
        },
        "Outerwear": {
            "Jackets": ["jacket", "blazer", "bomber"],
            "Coats": ["coat", "trench", "puffer", "parka"],
        },
        "Accessories": {
            "Belts": ["belt"],
            "Hats": ["hat", "beanie", "cap"],
            "Bags": ["bag", "purse", "tote", "clutch"],

        }
    }

    for primary_cat, sub_map in categories.items():
        for sub_cat, keywords in sub_map.items():
            for kw in keywords:
                if kw in combined_text:
                    return primary_cat, sub_cat
    return "Other", None

def smart_map_variant(variant, product_title=""):
   size = color = length = inseam = None


   option_keys = ["option1", "option2", "option3"]
   option_values = [str(variant.get(k, "")).strip().lower() for k in option_keys]

   # Add these for inseam scanning later
   variant_title = str(variant.get("title", "")).strip().lower()
   product_title = str(product_title).strip().lower()

   color_keywords = [
       "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
       "beige", "brown", "gray", "navy", "olive", "burgundy", "plaid", "stripe"
       "sage", "sand", "stone", "slate","gold",
   ]


   alpha_sizes = {
    # Standard alpha sizes
    "xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl",

    # Extended alpha sizes
    "2xs", "3xs", "4xs", "5xs", "1xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl",

    # Big and tall sizes
    "slt", "mt","lt", "xt", "xlt", 
    "1xlt", "2xlt", "3xlt", "4xlt", "5xlt", "6xlt", "7xlt", "8xlt",
    "mxt", "lxt", "xlxt", "1xlxt","2xlxt", "3xlxt", "4xlxt", "5xlxt", "6xlxt", "7xlxt", "8xlxt", 
    "1xb", "2xb", "3xb", "4xb", "5xb", "6xb", "7xb", "8xb", "9xb",
    "1xt",  "2xt",  "3xt",  "4xt",  "5xt",  "6xt",  "7xt",  "8xt",
    "lmt", "xlmt", "2xmt", "3xmt", "4xmt", "5xmt",


    # Plus sizes
    "0x", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x",

    #Between Sizes
    "XXS/XS","XS/S", "S/M", "M/L", "L/XL", "XL/1X",
    "1x/2x", "2x/3x", "3x/4x", "4x/5x", "5x/6x",

    # Numeric sizes (US women's)
   "000", "00", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36",

   # Shoe Sizes 
    "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5",
    "11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18",

    "2", "2 1/2", "3", "3 1/2", "4", "4 1/2", "5", "5 1/2", "6", "6 1/2", "7", "7 1/2", "8", "8 1/2", "9", "9 1/2", "10", "10 1/2",
    "11", "11 1/2", "12", "12 1/2", "13", "13 1/2", "14", "14 1/2", "15", "15 1/2", "16", "16 1/2", "17", "17 1/2", "18",

    "2 W", "2.5 W", "3 W", "3.5 W", "4 W", "4.5 W", "5 W", "5.5 W", "6 W", "6.5 W", "7 W", "7.5 W", "8 W", "8.5 W", "9 W", "9.5 W", "10 W", "10.5 W",
    "11 W", "11.5 W", "12 W", "12.5 W", "13 W", "13.5 W", "14 W", "14.5 W", "15 W", "15.5 W", "16 W", "16.5 W", "17 W", "17.5 W", "18 W",

    "2 3E", "2.5 3E", "3 3E", "3.5 3E", "4 3E", "4.5 3E", "5 3E", "5.5 3E", "6 3E", "6.5 3E", "7 3E", "7.5 3E", "8 3E", "8.5 3E", "9 3E", "9.5 3E", "10 3E", "10.5 3E",
    "11 3E", "11.5 3E", "12 3E", "12.5 3E", "13 3E", "13.5 3E", "14 3E", "14.5 3E", "15 3E", "15.5 3E", "16 3E", "16.5 3E", "17 3E", "17.5 3E", "18 3E",

    "2 5E", "2.5 5E", "3 5E", "3.5 5E", "4 5E", "4.5 5E", "5 5E", "5.5 5E", "6 5E", "6.5 5E", "7 5E", "7.5 5E", "8 5E", "8.5 5E", "9 5E", "9.5 5E", "10 5E", "10.5 5E",
    "11 5E", "11.5 5E", "12 5E", "12.5 5E", "13 5E", "13.5 5E", "14 5E", "14.5 5E", "15 5E", "15.5 5E", "16 5E", "16.5 5E", "17 5E", "17.5 5E", "18 5E",

    "EU 36", "EU 36.5", "EU 37", "EU 37.5", "EU 38", "EU 38.5", "EU 39", "EU 39.5", "EU 40", "EU 40.5", "EU 41", "EU 41.5", "EU 42", "EU 42.5", "EU 43", "EU 43.5", "EU 44", "EU 44.5",
    "EU 45", "EU 45.5", "EU 46", "EU 46.5", "EU 47", "EU 47.5", "EU 48", "EU 48.5", "EU 49", "EU 49.5", "EU 50",

    "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5",
    "45", "45.5", "46", "46.5", "47", "47.5", "48", "48.5", "49", "49.5", "50",


    # Numeric waist sizes (men's pants)
    "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "38", "39", "40", "42", "44", "46", "48", "50", "52", "54", "56",

    # Size Written Fortmat 
    "Size 24", "Size 25", "Size 26", "Size 27", "Size 28", "Size 29", "Size 30", "Size 31", "Size 32", "Size 33", "Size 34", "Size 35", "Size 36", "Size 37", "Size 38", "Size 39", "Size 40", "Size 42", "Size 44", "Size 46", "Size 48", "Size 50", "Size 52", "Size 54", "Size 56",
    "Size 24 ", "Size 25 ", "Size 26 ", "Size 27 ", "Size 28 ", "Size 29 ", "Size 30 ", "Size 31 ", "Size 32 ", "Size 33 ", "Size 34 ", "Size 35 ", "Size 36 ", "Size 37 ", "Size 38 ", "Size 39 ", "Size 40 ", "Size 42 ", "Size 44 ", "Size 46 ", "Size 48 ", "Size 50 ", "Size 52 ", "Size 54 ", "Size 56 ",
    "Size 24 /", "Size 25 /", "Size 26 /", "Size 27 /", "Size 28 /", "Size 29 /", "Size 30 /", "Size 31 /", "Size 32 /", "Size 33 /", "Size 34 /", "Size 35 /", "Size 36 /", "Size 37 /", "Size 38 /", "Size 39 /", "Size 40 /", "Size 42 /", "Size 44 /", "Size 46 /", "Size 48 /", "Size 50 /", "Size 52 /", "Size 54 /", "Size 56 /",



    # Waist x Inseam combinations
    "28x30", "28x32", "28x34", "28x36", "28x38", "28x40", "28x42", "28x44", "28x46", "28x48", "28x50",
    "30x30", "30x32", "30x34", "30x36", "30x38", "30x40", "30x42", "30x44", "30x46", "30x48", "30x50",
    "32x30", "32x32", "32x34", "32x36", "32x38", "32x40", "32x42", "32x44", "32x46", "32x48", "32x50",
    "34x30", "34x32", "34x34", "34x36", "34x38", "34x40", "34x42", "34x44", "34x46", "34x48", "34x50",
    "36x30", "36x32", "36x34", "36x36", "36x38", "36x40", "36x42", "36x44", "36x46", "36x48", "36x50",
    "38x30", "38x32", "38x34", "38x36", "38x38", "38x40", "38x42", "38x44", "38x46", "38x48", "38x50",
    "40x30", "40x32", "40x34", "40x36", "40x38", "40x40", "40x42", "40x44", "40x46", "40x48", "40x50",
    "42x30", "42x32", "42x34", "42x36", "42x38", "42x40", "42x42", "42x44", "42x46", "42x48", "42x50",
    "44x30", "44x32", "44x34", "44x36", "44x38", "44x40", "44x42", "44x44", "44x46", "44x48", "44x50",
    "46x30", "46x32", "46x34", "46x36", "46x38", "46x40", "46x42", "46x44", "46x46", "46x48", "46x50",
    "48x30", "48x32", "48x34", "48x36", "48x38", "48x40", "48x42", "48x44", "48x46", "48x48", "48x50",
    "50x30", "50x32", "50x34", "50x36", "50x38", "50x40", "50x42", "50x44", "50x46", "50x48", "50x50",
    "52x30", "52x32", "52x34", "52x36", "52x38", "52x40", "52x42", "52x44", "52x46", "52x48", "52x50",
    "54x30", "54x32", "54x34", "54x36", "54x38", "54x40", "54x42", "54x44", "54x46", "54x48", "54x50",
    "56x30", "56x32", "56x34", "56x36", "56x38", "56x40", "56x42", "56x44", "56x46", "56x48", "56x50",
    "58x30", "58x32", "58x34", "58x36", "58x38", "58x40", "58x42", "58x44", "58x46", "58x48", "58x50",
    "60x30", "60x32", "60x34", "60x36", "60x38", "60x40", "60x42", "60x44", "60x46", "60x48", "60x50",
    "62x30", "62x32", "62x34", "62x36", "62x38", "62x40", "62x42", "62x44", "62x46", "62x48", "62x50",
    "64x30", "64x32", "64x34", "64x36", "64x38", "64x40", "64x42", "64x44", "64x46", "64x48", "64x50",
    "66x30", "66x32", "66x34", "66x36", "66x38", "66x40", "66x42", "66x44", "66x46", "66x48", "66x50",
    "68x30", "68x32", "68x34", "68x36", "68x38", "68x40", "68x42", "68x44", "68x46", "68x48", "68x50",
    "70x30", "70x32", "70x34", "70x36", "70x38", "70x40", "70x42", "70x44", "70x46", "70x48", "70x50",
    "72x30", "72x32", "72x34", "72x36", "72x38", "72x40", "72x42", "72x44", "72x46", "72x48", "72x50",
    "74x30", "74x32", "74x34", "74x36", "74x38", "74x40", "74x42", "74x44", "74x46", "74x48", "74x50",
    "76x30", "76x32", "76x34", "76x36", "76x38", "76x40", "76x42", "76x44", "76x46", "76x48", "76x50",
    "78x30", "78x32", "78x34", "78x36", "78x38", "78x40", "78x42", "78x44", "78x46", "78x48", "78x50",
    "80x30", "80x32", "80x34", "80x36", "80x38", "80x40", "80x42", "80x44", "80x46", "80x48", "80x50",


    "28 x 30", "28 x 32", "28 x 34", "28 x 36", "28 x 38", "28 x 40", "28 x 42", "28 x 44", "28 x 46", "28 x 48", "28 x 50",
    "30 x 30", "30 x 32", "30 x 34", "30 x 36", "30 x 38", "30 x 40", "30 x 42", "30 x 44", "30 x 46", "30 x 48", "30 x 50",
    "32 x 30", "32 x 32", "32 x 34", "32 x 36", "32 x 38", "32 x 40", "32 x 42", "32 x 44", "32 x 46", "32 x 48", "32 x 50",
    "34 x 30", "34 x 32", "34 x 34", "34 x 36", "34 x 38", "34 x 40", "34 x 42", "34 x 44", "34 x 46", "34 x 48", "34 x 50",
    "36 x 30", "36 x 32", "36 x 34", "36 x 36", "36 x 38", "36 x 40", "36 x 42", "36 x 44", "36 x 46", "36 x 48", "36 x 50",
    "38 x 30", "38 x 32", "38 x 34", "38 x 36", "38 x 38", "38 x 40", "38 x 42", "38 x 44", "38 x 46", "38 x 48", "38 x 50",
    "40 x 30", "40 x 32", "40 x 34", "40 x 36", "40 x 38", "40 x 40", "40 x 42", "40 x 44", "40 x 46", "40 x 48", "40 x 50",
    "42 x 30", "42 x 32", "42 x 34", "42 x 36", "42 x 38", "42 x 40", "42 x 42", "42 x 44", "42 x 46", "42 x 48", "42 x 50",
    "44 x 30", "44 x 32", "44 x 34", "44 x 36", "44 x 38", "44 x 40", "44 x 42", "44 x 44", "44 x 46", "44 x 48", "44 x 50",
    "46 x 30", "46 x 32", "46 x 34", "46 x 36", "46 x 38", "46 x 40", "46 x 42", "46 x 44", "46 x 46", "46 x 48", "46 x 50",
    "48 x 30", "48 x 32", "48 x 34", "48 x 36", "48 x 38", "48 x 40", "48 x 42", "48 x 44", "48 x 46", "48 x 48", "48 x 50",
    "50 x 30", "50 x 32", "50 x 34", "50 x 36", "50 x 38", "50 x 40", "50 x 42", "50 x 44", "50 x 46", "50 x 48", "50 x 50",
    "52 x 30", "52 x 32", "52 x 34", "52 x 36", "52 x 38", "52 x 40", "52 x 42", "52 x 44", "52 x 46", "52 x 48", "52 x 50",
    "54 x 30", "54 x 32", "54 x 34", "54 x 36", "54 x 38", "54 x 40", "54 x 42", "54 x 44", "54 x 46", "54 x 48", "54 x 50",
    "56 x 30", "56 x 32", "56 x 34", "56 x 36", "56 x 38", "56 x 40", "56 x 42", "56 x 44", "56 x 46", "56 x 48", "56 x 50",
    "58 x 30", "58 x 32", "58 x 34", "58 x 36", "58 x 38", "58 x 40", "58 x 42", "58 x 44", "58 x 46", "58 x 48", "58 x 50",
    "60 x 30", "60 x 32", "60 x 34", "60 x 36", "60 x 38", "60 x 40", "60 x 42", "60 x 44", "60 x 46", "60 x 48", "60 x 50",
    "62 x 30", "62 x 32", "62 x 34", "62 x 36", "62 x 38", "62 x 40", "62 x 42", "62 x 44", "62 x 46", "62 x 48", "62 x 50",
    "64 x 30", "64 x 32", "64 x 34", "64 x 36", "64 x 38", "64 x 40", "64 x 42", "64 x 44", "64 x 46", "64 x 48", "64 x 50",
    "66 x 30", "66 x 32", "66 x 34", "66 x 36", "66 x 38", "66 x 40", "66 x 42", "66 x 44", "66 x 46", "66 x 48", "66 x 50",
    "68 x 30", "68 x 32", "68 x 34", "68 x 36", "68 x 38", "68 x 40", "68 x 42", "68 x 44", "68 x 46", "68 x 48", "68 x 50",
    "70 x 30", "70 x 32", "70 x 34", "70 x 36", "70 x 38", "70 x 40", "70 x 42", "70 x 44", "70 x 46", "70 x 48", "70 x 50",
    "72 x 30", "72 x 32", "72 x 34", "72 x 36", "72 x 38", "72 x 40", "72 x 42", "72 x 44", "72 x 46", "72 x 48", "72 x 50",
    "74 x 30", "74 x 32", "74 x 34", "74 x 36", "74 x 38", "74 x 40", "74 x 42", "74 x 44", "74 x 46", "74 x 48", "74 x 50",
    "76 x 30", "76 x 32", "76 x 34", "76 x 36", "76 x 38", "76 x 40", "76 x 42", "76 x 44", "76 x 46", "76 x 48", "76 x 50",
    "78 x 30", "78 x 32", "78 x 34", "78 x 36", "78 x 38", "78 x 40", "78 x 42", "78 x 44", "78 x 46", "78 x 48", "78 x 50",
    "80 x 30", "80 x 32", "80 x 34", "80 x 36", "80 x 38", "80 x 40", "80 x 42", "80 x 44", "80 x 46", "80 x 48", "80 x 50",


    "28 x 30 length", "28 x 32 length", "28 x 34 length", "28 x 36 length", "28 x 38 length", "28 x 40 length", "28 x 42 length", "28 x 44 length", "28 x 46 length", "28 x 48 length", "28 x 50 length",
    "30 x 30 length", "30 x 32 length", "30 x 34 length", "30 x 36 length", "30 x 38 length", "30 x 40 length", "30 x 42 length", "30 x 44 length", "30 x 46 length", "30 x 48 length", "30 x 50 length",
    "32 x 30 length", "32 x 32 length", "32 x 34 length", "32 x 36 length", "32 x 38 length", "32 x 40 length", "32 x 42 length", "32 x 44 length", "32 x 46 length", "32 x 48 length", "32 x 50 length",
    "34 x 30 length", "34 x 32 length", "34 x 34 length", "34 x 36 length", "34 x 38 length", "34 x 40 length", "34 x 42 length", "34 x 44 length", "34 x 46 length", "34 x 48 length", "34 x 50 length",
    "36 x 30 length", "36 x 32 length", "36 x 34 length", "36 x 36 length", "36 x 38 length", "36 x 40 length", "36 x 42 length", "36 x 44 length", "36 x 46 length", "36 x 48 length", "36 x 50 length",
    "38 x 30 length", "38 x 32 length", "38 x 34 length", "38 x 36 length", "38 x 38 length", "38 x 40 length", "38 x 42 length", "38 x 44 length", "38 x 46 length", "38 x 48 length", "38 x 50 length",
    "40 x 30 length", "40 x 32 length", "40 x 34 length", "40 x 36 length", "40 x 38 length", "40 x 40 length", "40 x 42 length", "40 x 44 length", "40 x 46 length", "40 x 48 length", "40 x 50 length",
    "42 x 30 length", "42 x 32 length", "42 x 34 length", "42 x 36 length", "42 x 38 length", "42 x 40 length", "42 x 42 length", "42 x 44 length", "42 x 46 length", "42 x 48 length", "42 x 50 length",
    "44 x 30 length", "44 x 32 length", "44 x 34 length", "44 x 36 length", "44 x 38 length", "44 x 40 length", "44 x 42 length", "44 x 44 length", "44 x 46 length", "44 x 48 length", "44 x 50 length",
    "46 x 30 length", "46 x 32 length", "46 x 34 length", "46 x 36 length", "46 x 38 length", "46 x 40 length", "46 x 42 length", "46 x 44 length", "46 x 46 length", "46 x 48 length", "46 x 50 length",
    "48 x 30 length", "48 x 32 length", "48 x 34 length", "48 x 36 length", "48 x 38 length", "48 x 40 length", "48 x 42 length", "48 x 44 length", "48 x 46 length", "48 x 48 length", "48 x 50 length",
    "50 x 30 length", "50 x 32 length", "50 x 34 length", "50 x 36 length", "50 x 38 length", "50 x 40 length", "50 x 42 length", "50 x 44 length", "50 x 46 length", "50 x 48 length", "50 x 50 length",
    "52 x 30 length", "52 x 32 length", "52 x 34 length", "52 x 36 length", "52 x 38 length", "52 x 40 length", "52 x 42 length", "52 x 44 length", "52 x 46 length", "52 x 48 length", "52 x 50 length",
    "54 x 30 length", "54 x 32 length", "54 x 34 length", "54 x 36 length", "54 x 38 length", "54 x 40 length", "54 x 42 length", "54 x 44 length", "54 x 46 length", "54 x 48 length", "54 x 50 length",
    "56 x 30 length", "56 x 32 length", "56 x 34 length", "56 x 36 length", "56 x 38 length", "56 x 40 length", "56 x 42 length", "56 x 44 length", "56 x 46 length", "56 x 48 length", "56 x 50 length",
    "58 x 30 length", "58 x 32 length", "58 x 34 length", "58 x 36 length", "58 x 38 length", "58 x 40 length", "58 x 42 length", "58 x 44 length", "58 x 46 length", "58 x 48 length", "58 x 50 length",
    "60 x 30 length", "60 x 32 length", "60 x 34 length", "60 x 36 length", "60 x 38 length", "60 x 40 length", "60 x 42 length", "60 x 44 length", "60 x 46 length", "60 x 48 length", "60 x 50 length",
    "62 x 30 length", "62 x 32 length", "62 x 34 length", "62 x 36 length", "62 x 38 length", "62 x 40 length", "62 x 42 length", "62 x 44 length", "62 x 46 length", "62 x 48 length", "62 x 50 length",
    "64 x 30 length", "64 x 32 length", "64 x 34 length", "64 x 36 length", "64 x 38 length", "64 x 40 length", "64 x 42 length", "64 x 44 length", "64 x 46 length", "64 x 48 length", "64 x 50 length",
    "66 x 30 length", "66 x 32 length", "66 x 34 length", "66 x 36 length", "66 x 38 length", "66 x 40 length", "66 x 42 length", "66 x 44 length", "66 x 46 length", "66 x 48 length", "66 x 50 length",
    "68 x 30 length", "68 x 32 length", "68 x 34 length", "68 x 36 length", "68 x 38 length", "68 x 40 length", "68 x 42 length", "68 x 44 length", "68 x 46 length", "68 x 48 length", "68 x 50 length",
    "70 x 30 length", "70 x 32 length", "70 x 34 length", "70 x 36 length", "70 x 38 length", "70 x 40 length", "70 x 42 length", "70 x 44 length", "70 x 46 length", "70 x 48 length", "70 x 50 length",
    "72 x 30 length", "72 x 32 length", "72 x 34 length", "72 x 36 length", "72 x 38 length", "72 x 40 length", "72 x 42 length", "72 x 44 length", "72 x 46 length", "72 x 48 length", "72 x 50 length",
    "74 x 30 length", "74 x 32 length", "74 x 34 length", "74 x 36 length", "74 x 38 length", "74 x 40 length", "74 x 42 length", "74 x 44 length", "74 x 46 length", "74 x 48 length", "74 x 50 length",
    "76 x 30 length", "76 x 32 length", "76 x 34 length", "76 x 36 length", "76 x 38 length", "76 x 40 length", "76 x 42 length", "76 x 44 length", "76 x 46 length", "76 x 48 length", "76 x 50 length",
    "78 x 30 length", "78 x 32 length", "78 x 34 length", "78 x 36 length", "78 x 38 length", "78 x 40 length", "78 x 42 length", "78 x 44 length", "78 x 46 length", "78 x 48 length", "78 x 50 length",
    "80 x 30 length", "80 x 32 length", "80 x 34 length", "80 x 36 length", "80 x 38 length", "80 x 40 length", "80 x 42 length", "80 x 44 length", "80 x 46 length", "80 x 48 length", "80 x 50 length",

    #Regular Sizes
    "26R", "27R", "28R", "29R", "30R", "31R", "32R", "33R", "34R", "35R", "36R", "37R", "38R", "39R", "40R", "41R", "42R", "43R",
    "44R", "45R", "46R", "47R", "48R", "49R", "50R", "51R", "52R", "53R", "54R", "55R", "56R", "57R", "58R", "59R", "60R", "61R",
    "62R", "63R", "64R", "65R", "66R", "67R", "68R", "69R", "70R", "71R", "72R", "73R", "74R", "75R", "76R", "77R", "78R", "79R", "80R",

    "26 Regular", "27 Regular", "28 Regular", "29 Regular", "30 Regular", "31 Regular", "32 Regular", "33 Regular", "34 Regular", "35 Regular", "36 Regular", "37 Regular", "38 Regular", "39 Regular", "40 Regular", "41 Regular", "42 Regular", "43 Regular",
    "44 Regular", "45 Regular", "46 Regular", "47 Regular", "48 Regular", "49 Regular", "50 Regular", "51 Regular", "52 Regular", "53 Regular", "54 Regular", "55 Regular", "56 Regular", "57 Regular", "58 Regular", "59 Regular", "60 Regular", "61 Regular",
    "62 Regular", "63 Regular", "64 Regular", "65 Regular", "66 Regular", "67 Regular", "68 Regular", "69 Regular", "70 Regular", "71 Regular", "72 Regular", "73 Regular", "74 Regular", "75 Regular", "76 Regular", "77 Regular", "78 Regular", "79 Regular", "80 Regular",

    "26 Reg", "27 Reg", "28 Reg", "29 Reg", "30 Reg", "31 Reg", "32 Reg", "33 Reg", "34 Reg", "35 Reg", "36 Reg", "37 Reg", "38 Reg", "39 Reg", "40 Reg", "41 Reg", "42 Reg", "43 Reg",
    "44 Reg", "45 Reg", "46 Reg", "47 Reg", "48 Reg", "49 Reg", "50 Reg", "51 Reg", "52 Reg", "53 Reg", "54 Reg", "55 Reg", "56 Reg", "57 Reg", "58 Reg", "59 Reg", "60 Reg", "61 Reg",
    "62 Reg", "63 Reg", "64 Reg", "65 Reg", "66 Reg", "67 Reg", "68 Reg", "69 Reg", "70 Reg", "71 Reg", "72 Reg", "73 Reg", "74 Reg", "75 Reg", "76 Reg", "77 Reg", "78 Reg", "79 Reg", "80 Reg",

    "26-Reg", "27-Reg", "28-Reg", "29-Reg", "30-Reg", "31-Reg", "32-Reg", "33-Reg", "34-Reg", "35-Reg", "36-Reg", "37-Reg", "38-Reg", "39-Reg", "40-Reg", "41-Reg", "42-Reg", "43-Reg",
    "44-Reg", "45-Reg", "46-Reg", "47-Reg", "48-Reg", "49-Reg", "50-Reg", "51-Reg", "52-Reg", "53-Reg", "54-Reg", "55-Reg", "56-Reg", "57-Reg", "58-Reg", "59-Reg", "60-Reg", "61-Reg",
    "62-Reg", "63-Reg", "64-Reg", "65-Reg", "66-Reg", "67-Reg", "68-Reg", "69-Reg", "70-Reg", "71-Reg", "72-Reg", "73-Reg", "74-Reg", "75-Reg", "76-Reg", "77-Reg", "78-Reg", "79-Reg", "80-Reg",

    #Long Sizes
    "26L", "27L", "28L", "29L", "30L", "31L", "32L", "33L", "34L", "35L", "36L", "37L", "38L", "39L", "40L", "41L", "42L", "43L",
    "44L", "45L", "46L", "47L", "48L", "49L", "50L", "51L", "52L", "53L", "54L", "55L", "56L", "57L", "58L", "59L", "60L", "61L",
    "62L", "63L", "64L", "65L", "66L", "67L", "68L", "69L", "70L", "71L", "72L", "73L", "74L", "75L", "76L", "77L", "78L", "79L", "80L",

    "26 Long", "27 Long", "28 Long", "29 Long", "30 Long", "31 Long", "32 Long", "33 Long", "34 Long", "35 Long", "36 Long", "37 Long", "38 Long", "39 Long", "40 Long", "41 Long", "42 Long", "43 Long",
    "44 Long", "45 Long", "46 Long", "47 Long", "48 Long", "49 Long", "50 Long", "51 Long", "52 Long", "53 Long", "54 Long", "55 Long", "56 Long", "57 Long", "58 Long", "59 Long", "60 Long", "61 Long",
    "62 Long", "63 Long", "64 Long", "65 Long", "66 Long", "67 Long", "68 Long", "69 Long", "70 Long", "71 Long", "72 Long", "73 Long", "74 Long", "75 Long", "76 Long", "77 Long", "78 Long", "79 Long", "80 Long",

    "26-Long", "27-Long", "28-Long", "29-Long", "30-Long", "31-Long", "32-Long", "33-Long", "34-Long", "35-Long", "36-Long", "37-Long", "38-Long", "39-Long", "40-Long", "41-Long", "42-Long", "43-Long",
    "44-Long", "45-Long", "46-Long", "47-Long", "48-Long", "49-Long", "50-Long", "51-Long", "52-Long", "53-Long", "54-Long", "55-Long", "56-Long", "57-Long", "58-Long", "59-Long", "60-Long", "61-Long",
    "62-Long", "63-Long", "64-Long", "65-Long", "66-Long", "67-Long", "68-Long", "69-Long", "70-Long", "71-Long", "72-Long", "73-Long", "74-Long", "75-Long", "76-Long", "77-Long", "78-Long", "79-Long", "80-Long",

    #Tall Sizes
    "26T", "27T", "28T", "29T", "30T", "31T", "32T", "33T", "34T", "35T", "36T", "37T", "38T", "39T", "40T", "41T", "42T", "43T",
    "44T", "45T", "46T", "47T", "48T", "49T", "50T", "51T", "52T", "53T", "54T", "55T", "56T", "57T", "58T", "59T", "60T", "61T",
    "62T", "63T", "64T", "65T", "66T", "67T", "68T", "69T", "70T", "71T", "72T", "73T", "74T", "75T", "76T", "77T", "78T", "79T", "80T",

    "26 T", "27 T", "28 T", "29 T", "30 T", "31 T", "32 T", "33 T", "34 T", "35 T", "36 T", "37 T", "38 T", "39 T", "40 T", "41 T", "42 T", "43 T",
    "44 T", "45 T", "46 T", "47 T", "48 T", "49 T", "50 T", "51 T", "52 T", "53 T", "54 T", "55 T", "56 T", "57 T", "58 T", "59 T", "60 T", "61 T",
    "62 T", "63 T", "64 T", "65 T", "66 T", "67 T", "68 T", "69 T", "70 T", "71 T", "72 T", "73 T", "74 T", "75 T", "76 T", "77 T", "78 T", "79 T", "80 T",

    "26 Tall", "27 Tall", "28 Tall", "29 Tall", "30 Tall", "31 Tall", "32 Tall", "33 Tall", "34 Tall", "35 Tall", "36 Tall", "37 Tall", "38 Tall", "39 Tall", "40 Tall", "41 Tall", "42 Tall", "43 Tall",
    "44 Tall", "45 Tall", "46 Tall", "47 Tall", "48 Tall", "49 Tall", "50 Tall", "51 Tall", "52 Tall", "53 Tall", "54 Tall", "55 Tall", "56 Tall", "57 Tall", "58 Tall", "59 Tall", "60 Tall", "61 Tall",
    "62 Tall", "63 Tall", "64 Tall", "65 Tall", "66 Tall", "67 Tall", "68 Tall", "69 Tall", "70 Tall", "71 Tall", "72 Tall", "73 Tall", "74 Tall", "75 Tall", "76 Tall", "77 Tall", "78 Tall", "79 Tall", "80 Tall",

    "26-Tall", "27-Tall", "28-Tall", "29-Tall", "30-Tall", "31-Tall", "32-Tall", "33-Tall", "34-Tall", "35-Tall", "36-Tall", "37-Tall", "38-Tall", "39-Tall", "40-Tall", "41-Tall", "42-Tall", "43-Tall",
    "44-Tall", "45-Tall", "46-Tall", "47-Tall", "48-Tall", "49-Tall", "50-Tall", "51-Tall", "52-Tall", "53-Tall", "54-Tall", "55-Tall", "56-Tall", "57-Tall", "58-Tall", "59-Tall", "60-Tall", "61-Tall",
    "62-Tall", "63-Tall", "64-Tall", "65-Tall", "66-Tall", "67-Tall", "68-Tall", "69-Tall", "70-Tall", "71-Tall", "72-Tall", "73-Tall", "74-Tall", "75-Tall", "76-Tall", "77-Tall", "78-Tall", "79-Tall", "80-Tall",

    #Big Sizes
    "26B", "27B", "28B", "29B", "30B", "31B", "32B", "33B", "34B", "35B", "36B", "37B", "38B", "39B", "40B", "41B", "42B", "43B",
    "44B", "45B", "46B", "47B", "48B", "49B", "50B", "51B", "52B", "53B", "54B", "55B", "56B", "57B", "58B", "59B", "60B", "61B",
    "62B", "63B", "64B", "65B", "66B", "67B", "68B", "69B", "70B", "71B", "72B", "73B", "74B", "75B", "76B", "77B", "78B", "79B", "80B",

    "26 B", "27 B", "28 B", "29 B", "30 B", "31 B", "32 B", "33 B", "34 B", "35 B", "36 B", "37 B", "38 B", "39 B", "40 B", "41 B", "42 B", "43 B",
    "44 B", "45 B", "46 B", "47 B", "48 B", "49 B", "50 B", "51 B", "52 B", "53 B", "54 B", "55 B", "56 B", "57 B", "58 B", "59 B", "60 B", "61 B",
    "62 B", "63 B", "64 B", "65 B", "66 B", "67 B", "68 B", "69 B", "70 B", "71 B", "72 B", "73 B", "74 B", "75 B", "76 B", "77 B", "78 B", "79 B", "80 B",

    "26 Big", "27 Big", "28 Big", "29 Big", "30 Big", "31 Big", "32 Big", "33 Big", "34 Big", "35 Big", "36 Big", "37 Big", "38 Big", "39 Big", "40 Big", "41 Big", "42 Big", "43 Big",
    "44 Big", "45 Big", "46 Big", "47 Big", "48 Big", "49 Big", "50 Big", "51 Big", "52 Big", "53 Big", "54 Big", "55 Big", "56 Big", "57 Big", "58 Big", "59 Big", "60 Big", "61 Big",
    "62 Big", "63 Big", "64 Big", "65 Big", "66 Big", "67 Big", "68 Big", "69 Big", "70 Big", "71 Big", "72 Big", "73 Big", "74 Big", "75 Big", "76 Big", "77 Big", "78 Big", "79 Big", "80 Big",

    "26-Big", "27-Big", "28-Big", "29-Big", "30-Big", "31-Big", "32-Big", "33-Big", "34-Big", "35-Big", "36-Big", "37-Big", "38-Big", "39-Big", "40-Big", "41-Big", "42-Big", "43-Big",
    "44-Big", "45-Big", "46-Big", "47-Big", "48-Big", "49-Big", "50-Big", "51-Big", "52-Big", "53-Big", "54-Big", "55-Big", "56-Big", "57-Big", "58-Big", "59-Big", "60-Big", "61-Big",
    "62-Big", "63-Big", "64-Big", "65-Big", "66-Big", "67-Big", "68-Big", "69-Big", "70-Big", "71-Big", "72-Big", "73-Big", "74-Big", "75-Big", "76-Big", "77-Big", "78-Big", "79-Big", "80-Big",

    #Short Sizes 
    "26S", "27S", "28S", "29S", "30S", "31S", "32S", "33S", "34S", "35S", "36S", "37S", "38S", "39S", "40S", "41S", "42S", "43S",
    "44S", "45S", "46S", "47S", "48S", "49S", "50S", "51S", "52S", "53S", "54S", "55S", "56S", "57S", "58S", "59S", "60S", "61S",
    "62S", "63S", "64S", "65S", "66S", "67S", "68S", "69S", "70S", "71S", "72S", "73S", "74S", "75S", "76S", "77S", "78S", "79S", "80S",

    #XT Sizes
    "26XT", "27XT", "28XT", "29XT", "30XT", "31XT", "32XT", "33XT", "34XT", "35XT", "36XT", "37XT", "38XT", "39XT", "40XT", "41XT", "42XT", "43XT",
    "44XT", "45XT", "46XT", "47XT", "48XT", "49XT", "50XT", "51XT", "52XT", "53XT", "54XT", "55XT", "56XT", "57XT", "58XT", "59XT", "60XT", "61XT",
    "62XT", "63XT", "64XT", "65XT", "66XT", "67XT", "68XT", "69XT", "70XT", "71XT", "72XT", "73XT", "74XT", "75XT", "76XT", "77XT", "78XT", "79XT", "80XT",

    "26 Extra Tall", "27 Extra Tall", "28 Extra Tall", "29 Extra Tall", "30 Extra Tall", "31 Extra Tall", "32 Extra Tall", "33 Extra Tall", "34 Extra Tall", "35 Extra Tall", "36 Extra Tall", "37 Extra Tall", "38 Extra Tall", "39 Extra Tall", "40 Extra Tall", "41 Extra Tall", "42 Extra Tall", "43 Extra Tall",
    "44 Extra Tall", "45 Extra Tall", "46 Extra Tall", "47 Extra Tall", "48 Extra Tall", "49 Extra Tall", "50 Extra Tall", "51 Extra Tall", "52 Extra Tall", "53 Extra Tall", "54 Extra Tall", "55 Extra Tall", "56 Extra Tall", "57 Extra Tall", "58 Extra Tall", "59 Extra Tall", "60 Extra Tall", "61 Extra Tall",
    "62 Extra Tall", "63 Extra Tall", "64 Extra Tall", "65 Extra Tall", "66 Extra Tall", "67 Extra Tall", "68 Extra Tall", "69 Extra Tall", "70 Extra Tall", "71 Extra Tall", "72 Extra Tall", "73 Extra Tall", "74 Extra Tall", "75 Extra Tall", "76 Extra Tall", "77 Extra Tall", "78 Extra Tall", "79 Extra Tall", "80 Extra Tall",

    #XLT Sizes
    "26XLT", "27XLT", "28XLT", "29XLT", "30XLT", "31XLT", "32XLT", "33XLT", "34XLT", "35XLT", "36XLT", "37XLT", "38XLT", "39XLT", "40XLT", "41XLT", "42XLT", "43XLT",
    "44XLT", "45XLT", "46XLT", "47XLT", "48XLT", "49XLT", "50XLT", "51XLT", "52XLT", "53XLT", "54XLT", "55XLT", "56XLT", "57XLT", "58XLT", "59XLT", "60XLT", "61XLT",
    "62XLT", "63XLT", "64XLT", "65XLT", "66XLT", "67XLT", "68XLT", "69XLT", "70XLT", "71XLT", "72XLT", "73XLT", "74XLT", "75XLT", "76XLT", "77XLT", "78XLT", "79XLT", "80XLT",

    # W sizes (waist)
    "28w", "30w", "32w", "34w", "36w", "38w", "40w", "42w", "44w", "46w", "48w", "50w", "52w", "54w",

    # Neck sizes
    "14", "14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5", "19", "19.5", "20",

    # Neck x Sleeve combinations
    "14x32", "15x32", "15x33", "15x34", "15.5x33", "15.5x34", "16x34", "16x35", "16.5x35",
    "17x34", "17x35", "17.5x34", "17.5x35", "18x34", "18.5x35", "19x36",

    # European sizes
    "eu32", "eu34", "eu36", "eu38", "eu40", "eu42", "eu44", "eu46", "eu48", "eu50",

    # UK sizes
    "uk4", "uk6", "uk8", "uk10", "uk12", "uk14", "uk16", "uk18", "uk20", "uk22", "uk24", "uk26", "uk28", "uk30",

    # Miscellaneous
   # "one size", "os", "osfm", "free size", "plus", "custom", "made to measure"

}


   length_terms = { "tall", "extra tall", "short", "petite", "regular", "big", "big and tall",
       "med", "medium", "xlong", "long", "portly regular", "portly long",
       "wide-2e", "wide-3e", "wide-5e", "xwide-3e", "xwide-5e", "xxwide-3e", "xxwide-5e" }
   
   inseam_terms = { 
    "/ 28\" Inseam", "/ 30\" Inseam", "/ 32\" Inseam", "/ 34\" Inseam", "/ 35\" Inseam", "/ 36\" Inseam", "/ 37\" Inseam", "/ 38\" Inseam",
    "28\" Inseam",  "30\" Inseam",  "32\" Inseam",  "34\" Inseam",  "35\" Inseam",  "36\" Inseam",  "37\" Inseam",  "38\" Inseam",
    
    "28\"", "30\"", "34\"","35\"", "36\"","37\"", "38\"",
    "28 inch","30 inch","32 inch","34 inch","35 inch", "36 inch","37 inch", "38 inch",
    "28 in", "30 in", "32 in","34 in", "36 in", "38 in",
    "28\" inseam","30\" inseam","32\" inseam", "34\" inseam", "36\" inseam", "38\" inseam",
    "inseam 28","inseam 30", "inseam 32", "inseam 34", "inseam 35", "inseam: 36", "inseam 37", "38 inseam",
    
}
       


   for val in option_values:
       if not val:
           continue
       val_clean = val.replace("&", "and")
       if val_clean in alpha_sizes:
           size = val
       elif any(term in val_clean for term in length_terms):
           length = val
       elif any(color in val_clean for color in color_keywords):
           color = val


   title = str(variant.get("title", "")).lower()

   if not size:
    sorted_sizes = sorted(alpha_sizes, key=lambda x: -len(x))  # prioritize longer strings
    for s in sorted_sizes:
        if s.lower() in title:
            size = s.upper()
            break
   if not color and any(x in title for x in color_keywords):
       color = next((x.title() for x in color_keywords if x in title), None)
   if not length and any(x in title for x in length_terms):
       length = next((x.title() for x in length_terms if x in title), None)


   if size and "big" in size.lower():
       length = "Big & Tall"
       size = None

   # Inseam detection from known patterns
   for val in option_values + [variant_title, product_title]:
        if not val:
            continue
        val_lower = val.lower().strip()
        for term in inseam_terms:
            if term.lower() in val_lower:
                match = re.search(r'\d{2}', term)
                if match:
                    try:
                        inseam_candidate = int(match.group())
                        if 20 <= inseam_candidate <= 50:
                            inseam = inseam_candidate
                            break
                    except:
                        continue
        if inseam:
            break

   return {"size": size, "color": color, "length": length, "inseam": inseam}


def lambda_handler(event, context):
    key = event["Records"][0]["s3"]["object"]["key"]
    print(f"Lambda triggered for key: {key}")
    time.sleep(1.5)

    try:
        obj = s3.get_object(Bucket=BUCKET_NAME, Key=key)
    except s3.exceptions.NoSuchKey:
        print(f"❌ No such key in bucket: {key}")
        raise

    raw_lines = obj["Body"].read().decode("utf-8").strip().splitlines()
    rows = []

    for i, line in enumerate(raw_lines):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as e:
            print(f"❌ JSONDecodeError on line {i + 1}: {e} — line content: {line[:120]}")
            continue

    flattened = []

    for row in rows:
        variants = row.get("variants", [])
        if not isinstance(variants, list):
            continue


        # Fallback: if vendor is a number, use brand name from store URL
        store_url = row.get("store", "")
        raw_vendor = row.get("vendor", "")
        if isinstance(raw_vendor, str) and raw_vendor.isdigit():
            store_url = row.get("store", "")
            fallback_vendor = store_url.replace("https://", "").replace("www.", "").split(".")[0]
            fallback_vendor = fallback_vendor.replace("-", " ").title()
            vendor = fallback_vendor
        else:
            vendor = raw_vendor

        common_data = {
            "product_title": row.get("title"),
            "description": clean_html(row.get("body_html", "")),
            "image_url": extract_first_image(row.get("images", [])),
            "category": row.get("product_type"),
            "vendor": vendor,
            "product_url": f"{store_url}/products/{row.get('handle')}",

            #"vendor": row.get("vendor"),
            # "tags": row.get("tags"),
        }

        for variant in variants:
            mapped = smart_map_variant(variant, row.get("title", ""))
            print("🧠 Mapped variant fields:", json.dumps(mapped, indent=2))
            primary_category, subcategory = map_categories(row.get("title", ""), row.get("product_type", ""), row.get("tags", []))


            try:
                price = float(str(variant.get("price", "")).replace("$", "").strip())
            except:
                price = None

            flat_row = {
                "product_id": row.get("id"),
                "variant_id": variant.get("id"),
                **common_data,
                "variant_title": variant.get("title"),
                "price": price,
                "available": variant.get("available"),
                "size": mapped["size"],
                "color": mapped["color"],
                "length": mapped["length"],
                "inseam": mapped.get("inseam"),
                "product_url": row.get("product_url"), 
                "primary_category": primary_category,
                "subcategory": subcategory,
            }

            ordered_row = {col: flat_row.get(col) for col in OUTPUT_COLUMNS}
            flattened.append(ordered_row)

    output_key = key.replace(INPUT_PREFIX, OUTPUT_PREFIX).replace(".json", ".json")
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=output_key,
        Body=json.dumps(flattened, indent=2).encode("utf-8"),
        ContentType="application/json"
    )

    print(f"✅ Uploaded flattened data to: {output_key}")
    return {
        "statusCode": 200,
        "body": f"Flattened JSON written to {output_key}"
    }



