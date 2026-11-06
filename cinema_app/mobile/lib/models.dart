String _id(Map<String, dynamic> json) =>
    (json['_id'] ?? json['id'] ?? '').toString();

class Movie {
  const Movie({
    required this.id,
    required this.title,
    required this.genre,
    required this.year,
    required this.rating,
    required this.durationMinutes,
    required this.description,
    required this.posterUrl,
    required this.cast,
    required this.isFeatured,
  });

  final String id;
  final String title;
  final String genre;
  final int year;
  final double rating;
  final int durationMinutes;
  final String description;
  final String posterUrl;
  final List<String> cast;
  final bool isFeatured;

  String get duration => '${durationMinutes ~/ 60}h ${durationMinutes % 60}m';

  factory Movie.fromJson(Map<String, dynamic> json) => Movie(
    id: _id(json),
    title: json['title'] as String? ?? '',
    genre: json['genre'] as String? ?? '',
    year: (json['year'] as num?)?.toInt() ?? 0,
    rating: (json['rating'] as num?)?.toDouble() ?? 0,
    durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
    description: json['description'] as String? ?? '',
    posterUrl: json['posterUrl'] as String? ?? '',
    cast: (json['cast'] as List<dynamic>? ?? []).cast<String>(),
    isFeatured: json['isFeatured'] as bool? ?? false,
  );
}

class Cinema {
  const Cinema({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.country,
    required this.phone,
  });

  final String id;
  final String name;
  final String address;
  final String city;
  final String country;
  final String phone;

  factory Cinema.fromJson(Map<String, dynamic> json) => Cinema(
    id: _id(json),
    name: json['name'] as String? ?? '',
    address: json['address'] as String? ?? '',
    city: json['city'] as String? ?? '',
    country: json['country'] as String? ?? '',
    phone: json['phone'] as String? ?? '',
  );
}

class Screen {
  const Screen({
    required this.id,
    required this.cinemaId,
    required this.cinemaName,
    required this.name,
    required this.rows,
    required this.columns,
    required this.seatPrice,
    required this.format,
  });

  final String id;
  final String cinemaId;
  final String cinemaName;
  final String name;
  final int rows;
  final int columns;
  final double seatPrice;
  final String format;

  factory Screen.fromJson(Map<String, dynamic> json) {
    final cinema = json['cinema'];
    return Screen(
      id: _id(json),
      cinemaId: cinema is Map<String, dynamic>
          ? _id(cinema)
          : cinema.toString(),
      cinemaName: cinema is Map<String, dynamic>
          ? cinema['name'] as String? ?? ''
          : '',
      name: json['name'] as String? ?? '',
      rows: (json['rows'] as num?)?.toInt() ?? 0,
      columns: (json['columns'] as num?)?.toInt() ?? 0,
      seatPrice: (json['seatPrice'] as num?)?.toDouble() ?? 0,
      format: json['format'] as String? ?? 'Standard',
    );
  }
}

class Showtime {
  const Showtime({
    required this.id,
    required this.movie,
    required this.screen,
    required this.startAt,
    required this.price,
    required this.bookedSeats,
  });

  final String id;
  final Movie movie;
  final Screen screen;
  final DateTime startAt;
  final double price;
  final List<String> bookedSeats;

  factory Showtime.fromJson(Map<String, dynamic> json) => Showtime(
    id: _id(json),
    movie: Movie.fromJson(json['movie'] as Map<String, dynamic>),
    screen: Screen.fromJson(json['screen'] as Map<String, dynamic>),
    startAt: DateTime.parse(json['startAt'] as String).toLocal(),
    price: (json['price'] as num?)?.toDouble() ?? 0,
    bookedSeats: (json['bookedSeats'] as List<dynamic>? ?? []).cast<String>(),
  );
}

class Review {
  const Review({
    required this.userName,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  final String userName;
  final int rating;
  final String comment;
  final DateTime createdAt;

  factory Review.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return Review(
      userName: user['name'] as String? ?? 'Moviegoer',
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
    );
  }
}

class Booking {
  const Booking({
    required this.id,
    required this.showtime,
    required this.seats,
    required this.total,
    required this.createdAt,
  });

  final String id;
  final Showtime showtime;
  final List<String> seats;
  final double total;
  final DateTime createdAt;

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
    id: _id(json),
    showtime: Showtime.fromJson(json['showtime'] as Map<String, dynamic>),
    seats: (json['seats'] as List<dynamic>? ?? []).cast<String>(),
    total: (json['total'] as num?)?.toDouble() ?? 0,
    createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
  );
}
