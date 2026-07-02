import { test, expect } from '@playwright/test';

test.describe('Study Rooms E2E', () => {
  test('should display study rooms page and create room modal', async ({ page }) => {
    // Navigate to study rooms
    await page.goto('http://localhost:8080/study-rooms');

    // Should see the header
    await expect(page.locator('text=Study Rooms').first()).toBeVisible();

    // Check if Create Room button exists
    const createRoomBtn = page.locator('button:has-text("Create Room")');
    if (await createRoomBtn.isVisible()) {
      await createRoomBtn.click();
      
      // Should open a modal or navigate to create room
      // Wait for a common element in the create room flow
      await expect(page.locator('text=Room Name').or(page.locator('text=Topic'))).toBeVisible();
    }
  });

  test('should list available active rooms', async ({ page }) => {
    await page.goto('http://localhost:8080/study-rooms');

    // We expect a grid or list of rooms. If it's empty, it says something like "No active rooms"
    const noRoomsMsg = page.locator('text=No active rooms');
    const roomCard = page.locator('.room-card').first(); // Replace with actual class if known

    // Either we have rooms, or we have the no rooms message
    await expect(noRoomsMsg.or(roomCard)).toBeVisible();
  });
});
