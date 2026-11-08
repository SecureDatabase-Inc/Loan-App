# Android Debug APK — Installation and Testing Guide

This guide is for installing and testing the first BoA Micro Finance debug APK on a
physical Android phone. It assumes no Android development experience.

## A. Before installation

### Where the APK is stored on the Windows computer

The verified debug APK is stored in two places:

- Original Gradle output:
  `C:\Users\Nana Obeng\Documents\Loan-App\client\android\app\build\outputs\apk\debug\app-debug.apk`
- Easy-to-find copy (use this one):
  `C:\Users\Nana Obeng\Desktop\BoA-Loan-App-APK\BoA-Micro-Finance-Debug-v1.0.0.apk`

### How to locate it in File Explorer

1. Press `Win + E` to open File Explorer.
2. Click in the address bar at the top.
3. Paste this path and press Enter:
   `C:\Users\Nana Obeng\Desktop\BoA-Loan-App-APK`
4. You should see `BoA-Micro-Finance-Debug-v1.0.0.apk`.

### How to transfer it using USB

1. Connect your Android phone to the computer with a USB cable.
2. On the phone, if a notification appears asking "Charging this device via USB", tap it and choose "File transfer" or "Transfer files".
3. On the computer, open File Explorer. Your phone should appear as a drive under "This PC".
4. Open the phone's "Download" or "Documents" folder.
5. Drag `BoA-Micro-Finance-Debug-v1.0.0.apk` from the Desktop folder into the phone folder.
6. Wait for the copy to finish, then safely eject the phone.

### How to transfer it using Google Drive

1. On the computer, open a browser and go to https://drive.google.com.
2. Sign in with your Google account.
3. Click "New" → "File upload" and select `BoA-Micro-Finance-Debug-v1.0.0.apk`.
4. On your phone, open the Google Drive app.
5. Find the uploaded file and tap it.
6. Tap "Download" to save it to the phone's Downloads folder.

## B. Installing on Android

Menu names differ between phone manufacturers (Samsung, Xiaomi, Tecno, Infinix,
etc.), but the steps are the same.

1. Open the **Files** or **My Files** app on your phone.
2. Go to **Downloads**.
3. Tap `BoA-Micro-Finance-Debug-v1.0.0.apk`.
4. Android will ask for permission to install from that app (for example "Allow
   Files to install unknown apps?"). Tap the switch to allow it, then press Back.
5. Tap the APK again. An installer screen appears. Tap **Install**.
6. Wait for "App installed". Tap **Open** or **Done**.
7. Confirm the app appears in your app drawer with the name
   "BoA Micro Finance" and the green BoA logo.

If Android shows "App not installed" or "Package appears to be invalid", see
Troubleshooting.

## C. First application launch

1. Open "BoA Micro Finance" from the app drawer.
2. You should see a short branded splash (green logo, "BoA Micro Finance",
   "Fast, trusted mobile loans"), then the Welcome screen.
3. The Welcome screen shows three buttons:
   - **Create Account**
   - **Log In**
   - **Continue as Guest**

### Test guest browsing without registering

1. Tap **Continue as Guest**.
2. You should land on the marketing page (`/home`) with information about the
   app, features, how it works, loan levels and FAQs.
3. Scroll through the page. You can browse freely as a guest.
4. Tap "Apply for a loan" (in the hero or loan-levels section). A dialog should
   appear asking you to create an account or log in. Tap "Keep browsing" to
   dismiss it.
5. Guests cannot open dashboards, balances, repayments, transactions or KYC.

## D. Backend connection

The APK was built with this embedded API URL:

`http://192.168.1.50:5000/api`

- It uses **LAN HTTP**, not localhost and not HTTPS.
- It is suitable for **physical-device testing on the same Wi-Fi network only**.
- It is **not** suitable for production and is not connected to a production API.
- The backend must be running on the development computer and reachable on the
  LAN.

### How to check that the phone and computer are on the same Wi-Fi

1. On the computer: open Settings → Network & Internet → Wi-Fi and note the
   network name.
2. On the phone: open Settings → Wi-Fi and confirm the same network name.
3. On the computer, find your LAN IP address:
   - Open Command Prompt and run `ipconfig`.
   - Look for "IPv4 Address" under your Wi-Fi adapter (for example
     `192.168.1.50`).

### Windows Firewall

The backend listens on port 5000. Windows Firewall may block the phone from
reaching it. If API requests fail:

1. Open "Windows Defender Firewall" → "Advanced settings".
2. Click "Inbound Rules" → "New Rule".
3. Choose "Port" → TCP → Specific local ports: `5000`.
4. Allow the connection, apply to all profiles, name it "BoA Loan API".
5. On the phone, retry the app.

If the embedded IP is wrong for your network, the app's welcome and guest pages
will still load, but login and all account features will fail until the APK is
rebuilt with the correct LAN IP (see Troubleshooting).

## E. Application testing

Use a test phone number and test password only. Do not use real customer data
or real KYC documents.

1. **Guest browsing** — Open the app, tap "Continue as Guest", browse the
   marketing page. Expected: page loads, all sections visible, no crash.
2. **Guest restrictions** — Tap "Apply for a loan". Expected: sign-in dialog
   appears. Try opening `/dashboard` directly via a deep link if possible.
   Expected: redirect to login.
3. **Account registration** — Tap "Create Account", fill in the form with test
   data, submit. Expected: account created, redirected to dashboard.
4. **Login** — Log out, then log in with the test account. Expected: dashboard
   loads with the user's name.
5. **Borrower dashboard** — Check the dashboard shows loan level, verification
   status and active loan area (empty is fine).
6. **Loan details and navigation** — Open "Loans", tap a loan if present.
   Expected: loan detail screen loads with timeline and repayment schedule.
7. **KYC screens** — Open Verification. Expected: Ghana Card and selfie screens
   open without crashing.
8. **Logout** — Settings → Sign Out (or Profile → Sign Out). Expected: returns
   to the welcome screen; reopening the app shows the welcome screen, not the
   dashboard.
9. **Closing and reopening** — Close the app fully and reopen. Expected: splash
   then welcome screen (session is not persisted in this debug build because the
   token is held in memory on web; on a real native build the Keystore persists
   it).
10. **Authentication session persistence** — While logged in, keep the app open
    and navigate between screens. Expected: no unexpected logouts.

Report any failure with: the screen you were on, what you tapped, what you
expected, what happened, and a screenshot if possible.

## F. Troubleshooting

- **APK not installing** — Check storage space, Android version (minimum
  Android 7.0 / API 24), and that the file downloaded completely. Re-download
  or re-copy the APK.
- **App already installed with a conflicting signature** — Uninstall the
  existing "BoA Micro Finance" app first (this removes local app data), then
  install the new APK.
- **Android blocking installation** — Re-open the APK and grant "Install unknown
  apps" for the app you used to open it (Files/Chrome/Drive).
- **App opens and immediately closes** — Likely a JavaScript error. Report the
  screen and steps; a rebuild with logging may be needed.
- **Welcome screen loads but API requests fail** — Check the phone and computer
  are on the same Wi-Fi, the backend is running, and Windows Firewall allows
  port 5000. See Section D.
- **Network connection refused** — The embedded IP is wrong for your network.
  The APK must be rebuilt with the correct LAN IP:
  `NEXT_PUBLIC_API_URL=http://<your-LAN-IP>:5000/api npm run build:android:debug`
- **Login failing** — Confirm the backend is running and reachable; check the
  phone number format; check server logs.
- **App not retaining a session** — Expected in this debug flow on web; on the
  native build the Keystore persists the token. Verify by keeping the app open.

Do not clear application data or uninstall an existing app without understanding
that it removes local app data and any in-progress state.
