import { chromium } from "playwright";

export async function submitApplication(application) {

    const browser = await chromium.launch({
        headless: false,
        slowMo: 5
    });

    const page = await browser.newPage();

    try {

        // 1. Open fake portal
        await page.goto("http://localhost:4000/login");

        // 2. Login
        await page.fill('input[name="username"]', "testuser");
        await page.fill('input[name="password"]', "testpass");

        await page.click('button[type="submit"]');
        // await page.waitForTimeout(2000);

        // 3. Wait for application page
        await page.waitForURL("**/application");

        // 4. Fill application
        await page.fill('input[name="name"]', application.name);
        await page.fill('input[name="email"]', application.email);
        await page.fill('input[name="phone"]', application.phone);

        // await page.waitForTimeout(3000);

        // 5. Submit
        await page.click('button[type="submit"]');

        // 6. Wait for acknowledgement
        await page.waitForSelector("#acknowledgement");

        const acknowledgementNumber =
            await page.locator("#acknowledgement").textContent();

        console.log("Acknowledgement:", acknowledgementNumber);

        return {
            success: true,
            acknowledgementNumber
        };

    } catch (error) {

        console.error("Browser automation failed:", error);

        return {
            success: false,
            error: error.message
        };

    } finally {
        // await page.waitForTimeout(5000);
        await browser.close();

    }
}