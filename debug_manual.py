from playwright.sync_api import sync_playwright

def verify_manual_call():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            page.goto("http://localhost:8080")
            page.wait_for_timeout(3000) # Wait for init

            # Manually call saveGameLocal
            print("Invoking saveGameLocal manually...")
            page.evaluate("window.sceneManager.currentScene().saveGameLocal()")

            page.wait_for_timeout(1000)

        except Exception as e:
            print(f"Test Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_manual_call()
