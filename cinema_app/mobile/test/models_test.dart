import 'package:flutter_test/flutter_test.dart';

import 'package:cinema_app/models.dart';

void main() {
  test('movie documents map MongoDB fields into the app model', () {
    final movie = Movie.fromJson({
      '_id': 'movie-id',
      'title': 'Stellar Void',
      'genre': 'Sci-Fi',
      'year': 2026,
      'rating': 9.1,
      'durationMinutes': 148,
      'description': 'A journey into the unknown.',
      'posterUrl': '',
      'cast': ['Elena Voss'],
      'isFeatured': true,
    });

    expect(movie.id, 'movie-id');
    expect(movie.duration, '2h 28m');
    expect(movie.isFeatured, isTrue);
  });

  test('populated showtime documents map nested movie and screen records', () {
    final showtime = Showtime.fromJson({
      '_id': 'showtime-id',
      'startAt': '2026-11-07T18:00:00.000Z',
      'price': 14,
      'bookedSeats': ['A1'],
      'movie': {
        '_id': 'movie-id',
        'title': 'Stellar Void',
        'genre': 'Sci-Fi',
        'year': 2026,
        'rating': 9,
        'durationMinutes': 148,
        'description': 'Synopsis',
        'cast': [],
      },
      'screen': {
        '_id': 'screen-id',
        'cinema': {'_id': 'cinema-id', 'name': 'Central'},
        'name': 'Hall 1',
        'rows': 8,
        'columns': 10,
        'seatPrice': 14,
        'format': 'IMAX',
      },
    });

    expect(showtime.id, 'showtime-id');
    expect(showtime.movie.title, 'Stellar Void');
    expect(showtime.screen.cinemaId, 'cinema-id');
    expect(showtime.bookedSeats, ['A1']);
  });
}
