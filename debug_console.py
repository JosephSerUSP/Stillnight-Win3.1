from playwright.sync_api import sync_playwright

def check_console_errors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PageError: {err}"))

        try:
            page.goto("http://localhost:8080")
            page.wait_for_timeout(2000)

            # Click Save Game
            page.locator(".menu-toggle", has_text="Game").click()
            page.locator("#menu-item-save-game").click()

            page.wait_for_timeout(1000)

        except Exception as e:
            print(f"Test Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    check_console_errors()
