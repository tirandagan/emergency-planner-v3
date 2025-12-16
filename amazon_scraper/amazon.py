from playwright.sync_api import sync_playwright
from playwright_stealth.stealth import Stealth
from selectorlib import Extractor
import json
import time
import random
import os
import sys
import argparse
from curl_cffi import requests as crequests

# Create an Extractor by reading from the YAML file
base_dir = os.path.dirname(os.path.abspath(__file__))
yaml_path = os.path.join(base_dir, 'selectors.yml')
e = Extractor.from_yaml_file(yaml_path)

def get_product_details_curl_cffi(url):
    try:
        # Use curl_cffi to impersonate a real browser (mimics TLS fingerprint)
        response = crequests.get(
            url,
            impersonate="chrome124",
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout=30
        )
        
        if response.status_code == 200:
             content = response.text
             if "To discuss automated access to Amazon data please contact" in content:
                 return {"error": "blocked", "message": "curl_cffi Blocked"}
             
             data = e.extract(content)
             
             # Clean strings
             if data:
                 for k, v in data.items():
                    if isinstance(v, str):
                        data[k] = v.strip()
                 
                 # Fallback for image if selectorlib failed
                 if not data.get('images') or data.get('images') == "{}":
                     # Simple regex or string find for common patterns if selectorlib failed
                     # (Selectors usually work if HTML is returned)
                     pass
                 
                 return data
             
             return {"error": "no_data", "message": "Extraction returned empty"}
    except Exception as ex:
        return {"error": "exception", "message": str(ex)}
    return None

def get_product_details(url):
    # Try curl_cffi first (lighter, better TLS fingerprinting)
    result = get_product_details_curl_cffi(url)
    if result and not result.get('error'):
        return result
        
    # If blocked or failed, try Playwright with Stealth
    return run_playwright(url)

def run_playwright(url):
    stealth = Stealth()
    with stealth.use_sync(sync_playwright()) as p:
        # Launch browser (Stealth will patch args automatically if used this way, 
        # but we can still pass some if needed, though Stealth prefers to handle them)
        browser = p.chromium.launch(
            headless=True,
            # Add basic args that Stealth might not cover or that we specifically want
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
            ],
            ignore_default_args=["--enable-automation"]
        )
        
        # Create context with a realistic viewport
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            permissions=['geolocation'],
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        try:
            # Simulate search referer
            page.set_extra_http_headers({
                "Referer": "https://www.google.com/"
            })

            # Randomize navigation timeout
            page.goto(url, timeout=60000, wait_until='domcontentloaded')
            
            # Random sleep to behave like a human
            sleep_time = random.uniform(2, 5)
            time.sleep(sleep_time)
            
            # Scroll to bottom to trigger lazy loads
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)
            page.evaluate("window.scrollTo(0, 0)")
            
            content = page.content()
            
            # Check for captcha
            if "To discuss automated access to Amazon data please contact" in content or "Type the characters you see in this image" in content:
                # Try to screenshot for debugging if needed
                # page.screenshot(path="captcha_block.png")
                return {"error": "blocked", "message": "Amazon Captcha detected"}

            data = e.extract(content)
            
            # Post-processing and validation
            if data:
                # Fallback for price if selectorlib failed
                if not data.get('price'):
                    try:
                        # Try to find price via Playwright selectors directly
                        price_element = page.query_selector('.a-price .a-offscreen') or \
                                        page.query_selector('#price_inside_buybox') or \
                                        page.query_selector('#priceblock_ourprice') or \
                                        page.query_selector('.a-text-price .a-offscreen')
                        
                        if price_element:
                            price_text = price_element.text_content().strip()
                            data['price'] = price_text
                    except Exception:
                        pass

                # Fallback for images if selectorlib failed or returned empty
                if not data.get('images') or data.get('images') == "{}":
                    try:
                        img_element = page.query_selector('#landingImage') or \
                                      page.query_selector('#imgBlkFront') or \
                                      page.query_selector('.imgTagWrapper img')
                        
                        if img_element:
                            # Try dynamic image first (better quality)
                            dynamic_image = img_element.get_attribute('data-a-dynamic-image')
                            if dynamic_image and dynamic_image.strip() != "{}" and dynamic_image.strip() != "":
                                data['images'] = dynamic_image
                            else:
                                # Fallback to src
                                src = img_element.get_attribute('src')
                                if src:
                                    data['images'] = src
                    except Exception:
                        pass

                # Clean strings
                for k, v in data.items():
                    if isinstance(v, str):
                        data[k] = v.strip()
                
                return data
            
            return {"error": "no_data", "message": "Extraction returned empty"}
            
        except Exception as err:
            return {"error": "exception", "message": str(err)}
        finally:
            browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Amazon Product Scraper')
    parser.add_argument('url', help='Product URL or ASIN')
    args = parser.parse_args()

    url = args.url
    if not url.startswith('http'):
        url = f"https://www.amazon.com/dp/{url}"

    result = get_product_details(url)
    print(json.dumps(result))
