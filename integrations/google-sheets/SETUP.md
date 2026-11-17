# Connect the website form to Google Sheets

The form posts to `/api/submit` (Vercel function) → your Apps Script web app → the Google Sheet
**"CKF Foundation · Website submissions"** (already created, ID in `Code.gs`).

1. Open the sheet, then **Extensions → Apps Script**.
2. Delete the placeholder code, paste all of `Code.gs`, and change `TOKEN` to a long random string. Optionally set `NOTIFY_EMAIL`.
3. **Deploy → New deployment → Web app**. Execute as **Me**; Who has access **Anyone**. Authorise when asked, then copy the **Web app URL** (ends in `/exec`).
4. In Vercel (**Project → Settings → Environment Variables**) add, for Production, Preview and Development:
   * `GOOGLE_SCRIPT_URL` = the web app URL
   * `SHEET_TOKEN` = the same string you put in `TOKEN`
5. **Redeploy** (Deployments → ⋯ → Redeploy). Submit the form on the live site and check a new row appears.

Until step 4 is done the form shows "Our form is not switched on yet" instead of silently losing messages.
