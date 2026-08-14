# App Store privacy release checklist

This repository publishes the privacy policy for the data-minimal release of *Moments / 走走小日 / てくてく日和*.

## App Store Connect URLs

Use the matching localized URL in **App Privacy → Privacy Policy**:

- Traditional Chinese: `https://www.mugio.studio/zh-TW/privacy`
- English (U.S.): `https://www.mugio.studio/en/privacy`
- Japanese: `https://www.mugio.studio/ja/privacy`

The **User Privacy Choices URL** is optional and can remain blank. If a separate URL is useful later, the choices section is available at each URL with `#choices` appended.

## When “No, we do not collect data from this app” is accurate

Choose this answer only after confirming all of the following for the exact release build:

- No account, login, remote profile, feedback upload, or server-backed feature.
- No analytics, advertising, attribution, crash-reporting, support-chat, or social SDK sends data off device.
- No cloud save, developer-accessible CloudKit record, multiplayer service, or remote configuration retains app data.
- No embedded web view sends app or user data to a website. A user opening the public website in their normal browser is separate from app collection.
- Game progress, settings, and gameplay content remain on device only.
- The app does not request camera, photo-library, microphone, contacts, or precise-location permission. In-game photography is a fictional mechanic and does not use the device camera.
- The shipped privacy manifests and required-reason API declarations match every bundled SDK.

Apple defines collection as transmitting data off device so that the developer or a third-party partner can access it for longer than needed to service a real-time request. Data processed only on device is not considered collected for the App Store privacy label. See [Apple’s App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).

## Before every submission

1. Audit the release build and every third-party SDK, not only Mugio-authored code.
2. Confirm the policy statements about accounts, permissions, analytics, ads, and local saves remain true.
3. Keep **App Store Connect → App Privacy** answers consistent with the policy. If any platform collects more data, answer for the most inclusive case.
4. Add an easy-to-find **Privacy Policy** link inside the app, such as **Settings / About / Legal**. A website URL in App Store Connect alone is not enough under Apple’s review guideline 5.1.1.
5. Test all three public policy URLs without authentication before submitting.
6. Update the policy, its “Last updated” date, and the App Store privacy answers before shipping any new off-device collection.

The website’s Google Analytics use is disclosed in the policy. It does not by itself become app collection unless analytics code is included in the app or app data is transmitted through an embedded web view.

Primary references: [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), and [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).
