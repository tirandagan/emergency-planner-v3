from playwright.sync_api import sync_playwright
from playwright_stealth.stealth import Stealth

def check_stealth():
    stealth = Stealth()
    with stealth.use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://bot.sannysoft.com/')
        page.screenshot(path='stealth_check.png')
        
        webdriver = page.evaluate("navigator.webdriver")
        print(f"navigator.webdriver: {webdriver}")
        
        ua = page.evaluate("navigator.userAgent")
        print(f"User Agent: {ua}")

if __name__ == '__main__':
    check_stealth()



















