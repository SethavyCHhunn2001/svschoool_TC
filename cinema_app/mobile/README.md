# CINÉMA Flutter app

The mobile client for the CINÉMA cinema-booking app. It requires the Node API
and MongoDB service described in the [project setup guide](../README.md).

```sh
flutter pub get
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000/api
```

For Android emulators, use `http://10.0.2.2:3000/api`. Set the
`API_BASE_URL` compile-time value to the deployed HTTPS API when building a
release.
