from playwright.sync_api import sync_playwright

def verify_menu_and_save_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 1. Load the game
            page.goto("http://localhost:8080")
            page.wait_for_selector("#game-container")

            # Wait for main menu bar
            page.wait_for_selector(".menu-bar")

            # 2. Click "Game" menu
            # Finding the toggle for "Game"
            game_menu_toggle = page.locator(".menu-toggle", has_text="Game")
            game_menu_toggle.click()

            # 3. Verify new menu items exist
            # We expect: New Game, Save Game (Local), Load Game (Local), Save Game File, Load Game File

            # Check for visibility of items
            save_local_btn = page.locator("#menu-item-save-game")
            load_local_btn = page.locator("#menu-item-load-game")
            save_file_btn = page.locator("#menu-item-save-file")
            load_file_btn = page.locator("#menu-item-load-file")

            # Wait a moment for animation if any (CSS transition)
            page.wait_for_timeout(500)

            if not save_local_btn.is_visible():
                print("Error: Save Local button not visible")
            if not load_local_btn.is_visible():
                print("Error: Load Local button not visible")
            if not save_file_btn.is_visible():
                print("Error: Save File button not visible")
            if not load_file_btn.is_visible():
                print("Error: Load File button not visible")

            # Take screenshot of the open menu
            page.screenshot(path="verification/menu_open.png")
            print("Screenshot saved to verification/menu_open.png")

            # 4. Test Save Local (Mocking localStorage is tricky in headless but we can check if click works)
            # We will click Save Local and check for "Game saved locally." log message
            save_local_btn.click()

            # Check log
            # The log message might be in #log-content .log-message
            # We wait for text "Game saved locally."
            page.wait_for_selector(".log-message", state="visible")

            # Use a slightly loose check because other logs exist
            # We want to see if "Game saved locally" appears in the log panel

            # Wait for specific log message
            # Note: The log panel adds divs. We search for text content.
            try:
                page.locator("#log-content").filter(has_text="Game saved locally.").wait_for(timeout=2000)
                print("Success: 'Game saved locally.' message found.")
            except:
                print("Failure: 'Game saved locally.' message NOT found.")

            # 5. Test Save File (Download)
            # We need to handle the download event
            with page.expect_download() as download_info:
                # Open menu again because clicking an item closed it
                game_menu_toggle.click()
                page.wait_for_timeout(200)
                save_file_btn.click()

            download = download_info.value
            print(f"Success: Download started for {download.suggested_filename}")

            # 6. Test Load Local (Prompt)
            # Since we are in a run (default), clicking Load should trigger a confirmation
            game_menu_toggle.click()
            page.wait_for_timeout(200)
            load_local_btn.click()

            # Check for confirmation window
            confirm_window = page.locator(".window-frame", has_text="Confirm Load")
            try:
                confirm_window.wait_for(state="visible", timeout=2000)
                print("Success: Confirmation window appeared for Load Game.")
                page.screenshot(path="verification/confirm_load.png")
            except:
                 print("Failure: Confirmation window did NOT appear.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_menu_and_save_load()
