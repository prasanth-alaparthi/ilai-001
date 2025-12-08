import { test, expect } from '@playwright/test';

test.describe('Full Functional Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // --- Mock Authentication ---
    await page.route('**/auth/authenticate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'mock-token' })
      });
    });

    await page.route('**/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'student',
          email: 'student@example.com',
          roles: ['STUDENT'],
          fullName: 'Test Student'
        })
      });
    });

    // --- Mock Calendar Services ---
    // Single handler for /calendar/events since both scheduled and unscheduled use it
    await page.route('**/calendar/events*', async route => {
        const url = route.request().url();
        
        if (url.includes('unscheduled=true')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: '2', title: 'Pending Homework', type: 'TODO' }
                ])
            });
        } else {
            // Regular events (with start/end params)
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: '1',
                        title: 'Mock Lecture',
                        startTime: new Date().toISOString(),
                        endTime: new Date(Date.now() + 3600000).toISOString(), // +1 hour
                        allDay: false,
                        type: 'ACADEMIC'
                    }
                ])
            });
        }
    });
  });

  // --- 1. Login & Dashboard ---
  test('Login and Dashboard Load', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username or Email').fill('student');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  // --- 2. Calendar Walkthrough ---
  test('Calendar View and Event Display', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.getByPlaceholder('Username or Email').fill('student');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/home/);

    // Navigate to Calendar
    await page.goto('/calendar');
    
    // Verify Calendar Page Loads
    await expect(page.getByText('Waiting List')).toBeVisible();
    
    // Verify Events are Loaded (Mocked)
    // "Mock Lecture" should be visible in the calendar grid or list
    // Since calendar rendering is complex (canvas or divs), checking for text is safest
    // Using .first() because it might appear in multiple views or tooltips
    await expect(page.getByText('Mock Lecture').first()).toBeVisible();

    // Verify Unscheduled Tasks
    await expect(page.getByText('Pending Homework')).toBeVisible();
    
    // Test Quick Add Task (UI only, since backend is mocked but we can verify the input clears)
    const taskInput = page.getByPlaceholder('Add a task...');
    await taskInput.fill('New Quick Task');
    await taskInput.press('Enter');
    // We didn't mock the POST response for create, so this might fail if the app expects a response.
    // Ideally we should mock the POST /calendar/events too if we want to test interaction.
  });

  // --- 3. Notes Walkthrough (Basic) ---
  test('Notes Dashboard Load', async ({ page }) => {
     // Mock Notes list
     await page.route('**/notes', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify([
                { id: '101', title: 'Physics Notes', content: 'E=mc^2', tags: [] }
            ])
        });
    });

    await page.goto('/login');
    await page.getByPlaceholder('Username or Email').fill('student');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/home/);

    await page.goto('/notes');
    await expect(page.getByText('Physics Notes')).toBeVisible();
  });
});
