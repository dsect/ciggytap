# CiggyTap

Mobile app prototype for interrupting smoking impulses with three actions:

- `Tap` to acknowledge the urge.
- `Shake It Off` to disrupt the moment.
- `Tap Out` to end the moment honestly.

Core capabilities:

- Manual logging for all three actions.
- Device shake detection for automatic `Shake It Off` events (can be toggled in Expo dev mode).
- Smoke-free analytics:
  - current streak (moments since last `Tap Out`)
  - current session duration
  - best session duration
  - average moments before `Tap Out`
- Local-only persistence via AsyncStorage.
- Jest test coverage for domain logic and app interaction.

## Run (For Humans)

1. Install Node.js (LTS) if you do not already have it.
2. Install Expo Go on your phone (iOS App Store or Google Play).
3. In a terminal, run:

```bash
cd mobile
npm install
npm run start -- --host lan
```

4. Wait for Expo to print a QR code.
5. Open Expo Go on your phone and scan the QR code.

If you prefer simulators/emulators:

- iOS simulator (macOS only): press `i` in the Expo terminal.
- Android emulator: press `a` in the Expo terminal.

If Expo says the port is busy, rerun with a different one:

```bash
npm run start -- --host lan --port 8082
```

Dev note about shake:

- In Expo development mode, physically shaking the phone can open the Expo developer menu.
- Use the in-app toggle under `Device shake` if you want to disable shake detection while debugging.

## Test

```bash
cd mobile
npm run test
```

## Project structure

- `mobile/` Expo React Native app (TypeScript)
- `design-documents/PROJECT_CHARTER.md` working charter (currently gitignored)
