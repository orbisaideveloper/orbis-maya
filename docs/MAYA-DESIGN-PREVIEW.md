# Local Maya design preview

Run `npm run dev -- --host 0.0.0.0 --port 3000 --strictPort` in Termux.
Open `http://localhost:3000/#/workspace` for the development preview.
Open `http://localhost:3000/?maya-design=1#/` for the full-screen design preview.
All six cards open their themed screens. Switch all three themes in Settings.
Design-preview input fields are presentation only; disabled actions create no results.
Normal `/dream` and `/history` continue to require verified authentication.
Workspace is a visual review tool, not an authenticated release control plane.

Render development configuration: `VITE_MAYA_DESIGN_WORKSPACE=1` at build time.
No deployment is part of this patch. Build-time public environment variables contain
only non-secret configuration. Do not add secrets to VITE variables.

Published view remains empty unless BOTH `VITE_MAYA_PUBLISHED_URL` (distinct HTTPS
origin) and `VITE_MAYA_PUBLISHED_REVISION` (approved pinned revision) are configured.
Use a separate public service/artifact that development never overwrites. Verify
release metadata, immutable asset serving, owner authorization and rollback before
enabling real publication. The Publish button is disabled in this candidate.

PWA installed name is Orbis Maya. Existing installations may need manifest refresh
or reinstall after an approved PWA build. Changing a theme never clears history.
