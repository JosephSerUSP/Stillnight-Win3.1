from playwright.sync_api import sync_playwright

def verify_theme(page):
    # Use ?test=true to expose global managers if needed, though not strictly required for CSS check
    page.goto("http://localhost:8080/index.html?test=true")

    # Wait for the game to initialize (theme manager init)
    page.wait_for_selector("#game-container", state="visible")

    # Wait a bit for theme to apply
    page.wait_for_timeout(2000)

    # Take a screenshot
    page.screenshot(path="verification/theme_check.png")

    # Verify CSS variables are set to the new default (original)
    desktop_bg = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--desktop-bg').trim()")
    print(f"Desktop BG: {desktop_bg}")

    # Check against the new default color #21252b
    if desktop_bg.lower() != "#21252b":
        print(f"FAILURE: Expected #21252b, got {desktop_bg}")
    else:
        print("SUCCESS: Default theme applied correctly.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_theme(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
