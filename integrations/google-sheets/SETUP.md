# Connect the website forms to Google Sheets

Both the contact form and the newsletter pop-up post to `/api/submit` (a Vercel function), which hands them to a small
Google Apps Script that adds a row to your Google Sheet. Everything runs inside the Foundation's own Google account.

You do this once, in about 5 minutes.

## 1. Create the Sheet (signed in as ckfoundationglobal@gmail.com)
1. Go to <https://sheets.google.com> and click **Blank spreadsheet**.
2. Name it **CKF Website Submissions**. Leave it empty. The script creates the tabs and headings by itself.

## 2. Add the script
1. In the Sheet choose **Extensions → Apps Script**.
2. Delete the sample code, then paste in everything from `integrations/google-sheets/Code.gs`.
3. Change `TOKEN` to a long random password (for example 30+ random letters and numbers). Write it down; you need it in step 4.
4. Optional: put `ckfoundationglobal@gmail.com` in `NOTIFY_EMAIL` to get an email for every enquiry and sign-up.
5. Click **Save** (disk icon).

## 3. Publish it
1. Click **Deploy → New deployment**. Click the gear and choose **Web app**.
2. **Execute as:** Me. **Who has access:** Anyone. Click **Deploy**.
3. Google asks you to authorise: **Authorise access → choose the Foundation account → Advanced → Go to (project) → Allow**.
4. Copy the **Web app URL** (it ends in `/exec`).

## 4. Tell the website where to send forms
In Vercel: **ckffoundation project → Settings → Environment Variables**. Add these for Production, Preview and Development:

| Name | Value |
|---|---|
| `GOOGLE_SCRIPT_URL` | the Web app URL from step 3 |
| `SHEET_TOKEN` | the same password you put in `TOKEN` |

Then **Deployments → ⋯ on the latest → Redeploy**.

## 5. Test it
Open the live site, submit the contact form and the newsletter pop-up. Two tabs, **Enquiries** and **Newsletter**, appear in the Sheet with the new rows.

## Notes
* Until step 4 is done the forms say "not switched on yet" instead of silently losing messages.
* If you change the script later, use **Deploy → Manage deployments → ✎ → New version** so the same URL keeps working.
* Each row also records the visitor's language and cookie choice, and the page they were on.
* The Sheet is private to the Foundation account unless you share it. Treat the data as personal information.
