import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:cinema_app/api.dart';
import 'package:cinema_app/main.dart';
import 'package:cinema_app/models.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('settings page opens a saved language preference page', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: SettingsPage()));
    await tester.pumpAndSettle();

    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('App language'), findsOneWidget);
    expect(find.text('Notifications'), findsOneWidget);
    expect(find.text('Downloads'), findsOneWidget);
    expect(find.text('Privacy'), findsOneWidget);

    await tester.tap(find.text('App language'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Choose your preferred language. The current app interface is in English.',
      ),
      findsOneWidget,
    );
    expect(find.text('English'), findsOneWidget);
    expect(find.text('Khmer'), findsOneWidget);
  });

  testWidgets('profile links to tickets, cinemas, and account settings', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ProfilePage(
          api: ApiClient(),
          user: const {
            'name': 'Moviegoer',
            'email': 'guest@example.com',
            'role': 'user',
          },
          onSignOut: () async {},
          onOpenCinemas: () {},
          onOpenBookings: () {},
        ),
      ),
    );

    expect(find.text('My bookings'), findsOneWidget);
    expect(find.text('Cinemas and showtimes'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('Help & support'), findsOneWidget);
  });

  testWidgets('booking confirmation shows reserved seats and cinema', (
    tester,
  ) async {
    const movie = Movie(
      id: 'movie-id',
      title: 'Stellar Void',
      genre: 'Sci-Fi',
      year: 2026,
      rating: 9,
      durationMinutes: 120,
      description: 'Synopsis',
      posterUrl: '',
      cast: [],
      isFeatured: false,
    );
    final showtime = Showtime(
      id: 'showtime-id',
      movie: movie,
      screen: Screen(
        id: 'screen-id',
        cinemaId: 'cinema-id',
        cinemaName: 'Central Cinema',
        name: 'Hall 1',
        rows: 8,
        columns: 10,
        seatPrice: 12,
        format: 'Standard',
      ),
      startAt: DateTime(2026, 11, 7, 18),
      price: 12,
      bookedSeats: ['A1'],
    );
    final booking = Booking(
      id: 'booking-id',
      showtime: showtime,
      seats: ['A1'],
      total: 12,
      createdAt: DateTime(2026, 11, 6),
    );

    await tester.pumpWidget(
      MaterialApp(home: BookingConfirmationPage(booking: booking)),
    );

    expect(find.text('Booking confirmed!'), findsOneWidget);
    expect(find.text('Central Cinema'), findsOneWidget);
    expect(find.text('A1'), findsOneWidget);
    expect(find.text('Booking booking-id'), findsOneWidget);
  });

  testWidgets('forgot password page clearly explains reset availability', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: ForgotPasswordPage(email: 'guest@example.com')),
    );

    expect(find.text('guest@example.com'), findsOneWidget);
    expect(
      find.textContaining('Password reset emails are not configured'),
      findsOneWidget,
    );
  });
}
