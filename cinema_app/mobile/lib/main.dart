import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CinemaApp());
}

class CinemaColors {
  static const background = Color(0xFF0A0A0F);
  static const surface = Color(0xFF12121A);
  static const card = Color(0xFF1C1C28);
  static const accent = Color(0xFFFF4C4C);
  static const gold = Color(0xFFFFD166);
  static const text = Color(0xFFF0F0F5);
  static const muted = Color(0xFF8A8A9B);
  static const border = Color(0xFF2A2A38);
}

class CinemaApp extends StatefulWidget {
  const CinemaApp({super.key});

  @override
  State<CinemaApp> createState() => _CinemaAppState();
}

class _CinemaAppState extends State<CinemaApp> {
  final _api = ApiClient();
  Map<String, dynamic>? _user;
  String? _sessionError;
  bool _checkingSession = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    await _api.restoreToken();
    if (_api.token != null) {
      try {
        _user = (await _api.get('/auth/me'))['user'] as Map<String, dynamic>;
      } on ApiException catch (error) {
        if (error.statusCode == 401) {
          await _api.clearToken();
        } else {
          _sessionError = error.message;
        }
      }
    }
    if (mounted) setState(() => _checkingSession = false);
  }

  void _authenticated(Map<String, dynamic> user) =>
      setState(() => _user = user);

  Future<void> _signOut() async {
    await _api.clearToken();
    if (mounted) setState(() => _user = null);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'CINÉMA',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: CinemaColors.background,
      colorScheme: const ColorScheme.dark(
        primary: CinemaColors.accent,
        surface: CinemaColors.surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CinemaColors.background,
        foregroundColor: CinemaColors.text,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CinemaColors.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CinemaColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CinemaColors.border),
        ),
      ),
    ),
    home: _checkingSession
        ? const Scaffold(body: Center(child: CircularProgressIndicator()))
        : _sessionError != null
        ? Scaffold(
            body: ErrorPanel(
              error: _sessionError!,
              onRetry: () {
                setState(() {
                  _sessionError = null;
                  _checkingSession = true;
                });
                _restoreSession();
              },
            ),
          )
        : _user == null
        ? AuthPage(api: _api, onAuthenticated: _authenticated)
        : CinemaHome(api: _api, user: _user!, onSignOut: _signOut),
  );
}

class AuthPage extends StatefulWidget {
  const AuthPage({required this.api, required this.onAuthenticated, super.key});

  final ApiClient api;
  final ValueChanged<Map<String, dynamic>> onAuthenticated;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final response = await widget.api.post(
        _register ? '/auth/register' : '/auth/login',
        {
          if (_register) 'name': _name.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
        },
      );
      await widget.api.setToken(response['token'] as String);
      widget.onAuthenticated(response['user'] as Map<String, dynamic>);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 430),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.play_circle_fill_rounded,
                  color: CinemaColors.accent,
                  size: 66,
                ),
                const SizedBox(height: 12),
                const Text(
                  'CINÉMA',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    letterSpacing: 8,
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _register ? 'Create your account' : 'Your world of film',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: CinemaColors.muted),
                ),
                const SizedBox(height: 36),
                if (_register) ...[
                  TextFormField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Full name'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter your name'
                        : null,
                  ),
                  const SizedBox(height: 14),
                ],
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'Email address'),
                  validator: (value) =>
                      value == null ||
                          !RegExp(r'^[^@]+@[^@]+\.[^@]+$')
                              .hasMatch(value.trim())
                      ? 'Enter a valid email'
                      : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                  validator: (value) =>
                      value == null || value.length < (_register ? 8 : 1)
                      ? _register
                            ? 'Use at least 8 characters'
                            : 'Enter your password'
                      : null,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Text(
                    _error!,
                    style: const TextStyle(color: CinemaColors.accent),
                  ),
                ],
                const SizedBox(height: 22),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: _busy
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_register ? 'Create account' : 'Sign in'),
                  ),
                ),
                TextButton(
                  onPressed: _busy
                      ? null
                      : () => setState(() {
                          _register = !_register;
                          _error = null;
                        }),
                  child: Text(
                    _register
                        ? 'Already have an account? Sign in'
                        : 'New to CINÉMA? Create an account',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class CinemaHome extends StatefulWidget {
  const CinemaHome({
    required this.api,
    required this.user,
    required this.onSignOut,
    super.key,
  });

  final ApiClient api;
  final Map<String, dynamic> user;
  final Future<void> Function() onSignOut;

  @override
  State<CinemaHome> createState() => _CinemaHomeState();
}

class _CinemaHomeState extends State<CinemaHome> {
  late final List<Widget> _pages;
  final _moviesKey = GlobalKey<_MoviesPageState>();
  final _cinemasKey = GlobalKey<_CinemasPageState>();
  final _bookingsKey = GlobalKey<_BookingsPageState>();
  final _adminKey = GlobalKey<_AdminPageState>();
  int _index = 0;
  bool get _isAdmin => widget.user['role'] == 'admin';
  late final List<String> _labels = [
    'Movies',
    'Cinemas',
    'Bookings',
    if (_isAdmin) 'Manage',
  ];

  @override
  void initState() {
    super.initState();
    _pages = [
      MoviesPage(key: _moviesKey, api: widget.api),
      CinemasPage(key: _cinemasKey, api: widget.api),
      BookingsPage(key: _bookingsKey, api: widget.api),
      if (_isAdmin) AdminPage(key: _adminKey, api: widget.api),
    ];
  }

  void _selectTab(int index) {
    setState(() => _index = index);
    switch (index) {
      case 0:
        _moviesKey.currentState?.reload();
      case 1:
        _cinemasKey.currentState?.reload();
      case 2:
        _bookingsKey.currentState?.reload();
      case 3:
        _adminKey.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    final icons = [
      Icons.local_movies_outlined,
      Icons.location_city_outlined,
      Icons.confirmation_num_outlined,
      if (_isAdmin) Icons.dashboard_customize_outlined,
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _labels[_index],
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Account',
            icon: const Icon(Icons.account_circle_outlined),
            onSelected: (value) {
              if (value == 'logout') widget.onSignOut();
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                enabled: false,
                child: Text(widget.user['name'] as String? ?? ''),
              ),
              const PopupMenuItem(value: 'logout', child: Text('Sign out')),
            ],
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _selectTab,
        destinations: [
          for (var i = 0; i < _labels.length; i++)
            NavigationDestination(icon: Icon(icons[i]), label: _labels[i]),
        ],
      ),
    );
  }
}

class MoviesPage extends StatefulWidget {
  const MoviesPage({required this.api, super.key});

  final ApiClient api;

  @override
  State<MoviesPage> createState() => _MoviesPageState();
}

class _MoviesPageState extends State<MoviesPage> {
  late Future<List<Movie>> _movies;

  Future<List<Movie>> _load() async {
    final result = await widget.api.get('/movies');
    return (result['movies'] as List<dynamic>)
        .map((item) => Movie.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _movies = _load();
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _movies = next);
    await next;
  }

  void reload() {
    setState(() {
      _movies = _load();
    });
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<Movie>>(
    future: _movies,
    builder: (context, snapshot) {
      if (snapshot.hasError) {
        return ErrorPanel(error: snapshot.error!, onRetry: _refresh);
      }
      if (!snapshot.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      final movies = snapshot.data!;
      if (movies.isEmpty) {
        return const EmptyPanel(
          icon: Icons.movie_outlined,
          message: 'No movies have been added yet.',
        );
      }
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            const Text(
              'NOW SHOWING',
              style: TextStyle(
                color: CinemaColors.muted,
                fontSize: 12,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 14),
            for (final movie in movies)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: MovieCard(
                  movie: movie,
                  onTap: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            MovieDetailsPage(api: widget.api, movie: movie),
                      ),
                    );
                    if (mounted) reload();
                  },
                ),
              ),
          ],
        ),
      );
    },
  );
}

class MovieCard extends StatelessWidget {
  const MovieCard({required this.movie, required this.onTap, super.key});

  final Movie movie;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
    color: CinemaColors.card,
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Row(
        children: [
          SizedBox(
            width: 112,
            height: 158,
            child: movie.posterUrl.isEmpty
                ? const ColoredBox(
                    color: Color(0xFF202039),
                    child: Icon(
                      Icons.movie_creation_outlined,
                      size: 42,
                      color: CinemaColors.muted,
                    ),
                  )
                : Image.network(
                    movie.posterUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const ColoredBox(
                      color: Color(0xFF202039),
                      child: Icon(
                        Icons.broken_image_outlined,
                        color: CinemaColors.muted,
                      ),
                    ),
                  ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (movie.isFeatured)
                    const Text(
                      'FEATURED',
                      style: TextStyle(
                        color: CinemaColors.accent,
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    movie.title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${movie.genre}  ·  ${movie.year}',
                    style: const TextStyle(color: CinemaColors.muted),
                  ),
                  const SizedBox(height: 9),
                  Row(
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        size: 17,
                        color: CinemaColors.gold,
                      ),
                      const SizedBox(width: 4),
                      Text(movie.rating.toStringAsFixed(1)),
                      const SizedBox(width: 12),
                      Text(
                        movie.duration,
                        style: const TextStyle(color: CinemaColors.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Details & tickets  ›',
                    style: TextStyle(color: CinemaColors.accent),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class MovieDetailsPage extends StatefulWidget {
  const MovieDetailsPage({required this.api, required this.movie, super.key});

  final ApiClient api;
  final Movie movie;

  @override
  State<MovieDetailsPage> createState() => _MovieDetailsPageState();
}

class _MovieDetailsPageState extends State<MovieDetailsPage> {
  late Future<List<dynamic>> _data;

  Future<List<dynamic>> _load() async {
    final responses = await Future.wait([
      widget.api.get('/showtimes?movieId=${widget.movie.id}'),
      widget.api.get('/movies/${widget.movie.id}/reviews'),
    ]);
    return [
      (responses[0]['showtimes'] as List<dynamic>)
          .map((item) => Showtime.fromJson(item as Map<String, dynamic>))
          .toList(),
      (responses[1]['reviews'] as List<dynamic>)
          .map((item) => Review.fromJson(item as Map<String, dynamic>))
          .toList(),
    ];
  }

  @override
  void initState() {
    super.initState();
    _data = _load();
  }

  Future<void> _writeReview() async {
    final result = await showDialog<(int, String)>(
      context: context,
      builder: (context) => const ReviewDialog(),
    );
    if (result == null || !mounted) return;
    try {
      await widget.api.post('/movies/${widget.movie.id}/reviews', {
        'rating': result.$1,
        'comment': result.$2,
      });
      setState(() {
        _data = _load();
      });
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final movie = widget.movie;
    return Scaffold(
      appBar: AppBar(title: Text(movie.title)),
      body: FutureBuilder<List<dynamic>>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return ErrorPanel(
              error: snapshot.error!,
              onRetry: () {
                setState(() {
                  _data = _load();
                });
              },
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final showtimes = snapshot.data![0] as List<Showtime>;
          final reviews = snapshot.data![1] as List<Review>;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (movie.posterUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Image.network(
                    movie.posterUrl,
                    height: 240,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox.shrink(),
                  ),
                ),
              const SizedBox(height: 18),
              Text(
                movie.title,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${movie.genre}  ·  ${movie.year}  ·  ${movie.duration}',
                style: const TextStyle(color: CinemaColors.muted),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.star_rounded,
                    color: CinemaColors.gold,
                    size: 20,
                  ),
                  const SizedBox(width: 5),
                  Text('${movie.rating.toStringAsFixed(1)} / 10'),
                ],
              ),
              const SizedBox(height: 18),
              Text(movie.description, style: const TextStyle(height: 1.55)),
              if (movie.cast.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text(
                  'CAST  ·  ${movie.cast.join(', ')}',
                  style: const TextStyle(color: CinemaColors.muted),
                ),
              ],
              const SizedBox(height: 28),
              const SectionTitle('UPCOMING SHOWTIMES'),
              const SizedBox(height: 12),
              if (showtimes.isEmpty)
                const Text(
                  'No upcoming showtimes.',
                  style: TextStyle(color: CinemaColors.muted),
                )
              else
                for (final showtime in showtimes)
                  Card(
                    color: CinemaColors.card,
                    child: ListTile(
                      leading: const Icon(
                        Icons.schedule,
                        color: CinemaColors.accent,
                      ),
                      title: Text(
                        '${showtime.startAt.day}/${showtime.startAt.month}  ${formatTime(showtime.startAt)}',
                      ),
                      subtitle: Text(
                        '${showtime.screen.name}  ·  ${showtime.screen.format}  ·  ${showtime.price.toStringAsFixed(2)}',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () async {
                        final booked = await Navigator.of(context).push<bool>(
                          MaterialPageRoute(
                            builder: (_) => BookingPage(
                              api: widget.api,
                              showtime: showtime,
                            ),
                          ),
                        );
                        if (booked == true && mounted) {
                          setState(() {
                            _data = _load();
                          });
                        }
                      },
                    ),
                  ),
              const SizedBox(height: 28),
              Row(
                children: [
                  const Expanded(child: SectionTitle('REVIEWS')),
                  TextButton.icon(
                    onPressed: _writeReview,
                    icon: const Icon(Icons.rate_review_outlined),
                    label: const Text('Write'),
                  ),
                ],
              ),
              if (reviews.isEmpty)
                const Text(
                  'Be the first to review this film.',
                  style: TextStyle(color: CinemaColors.muted),
                )
              else
                for (final review in reviews)
                  Card(
                    color: CinemaColors.card,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  review.userName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.star_rounded,
                                size: 16,
                                color: CinemaColors.gold,
                              ),
                              Text(' ${review.rating}/5'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(review.comment),
                        ],
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class ReviewDialog extends StatefulWidget {
  const ReviewDialog({super.key});

  @override
  State<ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<ReviewDialog> {
  final _comment = TextEditingController();
  int _rating = 5;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Write a review'),
    content: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        DropdownButtonFormField<int>(
          initialValue: _rating,
          decoration: const InputDecoration(labelText: 'Rating'),
          items: [
            for (var rating = 5; rating >= 1; rating--)
              DropdownMenuItem(value: rating, child: Text('$rating / 5')),
          ],
          onChanged: (value) => setState(() => _rating = value ?? _rating),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _comment,
          minLines: 3,
          maxLines: 5,
          maxLength: 1500,
          decoration: const InputDecoration(labelText: 'Your review'),
        ),
      ],
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          if (_comment.text.trim().isNotEmpty) {
            Navigator.pop(context, (_rating, _comment.text.trim()));
          }
        },
        child: const Text('Post review'),
      ),
    ],
  );
}

class CinemasPage extends StatefulWidget {
  const CinemasPage({required this.api, super.key});

  final ApiClient api;

  @override
  State<CinemasPage> createState() => _CinemasPageState();
}

class _CinemasPageState extends State<CinemasPage> {
  late Future<List<dynamic>> _data;

  Future<List<dynamic>> _load() async {
    final result = await Future.wait([
      widget.api.get('/cinemas'),
      widget.api.get('/screens'),
      widget.api.get('/showtimes'),
    ]);
    return [
      (result[0]['cinemas'] as List<dynamic>)
          .map((item) => Cinema.fromJson(item as Map<String, dynamic>))
          .toList(),
      (result[1]['screens'] as List<dynamic>)
          .map((item) => Screen.fromJson(item as Map<String, dynamic>))
          .toList(),
      (result[2]['showtimes'] as List<dynamic>)
          .map((item) => Showtime.fromJson(item as Map<String, dynamic>))
          .toList(),
    ];
  }

  @override
  void initState() {
    super.initState();
    _data = _load();
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _data = next);
    await next;
  }

  void reload() {
    setState(() {
      _data = _load();
    });
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<dynamic>>(
    future: _data,
    builder: (context, snapshot) {
      if (snapshot.hasError) {
        return ErrorPanel(
          error: snapshot.error!,
          onRetry: () {
            setState(() {
              _data = _load();
            });
          },
        );
      }
      if (!snapshot.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      final cinemas = snapshot.data![0] as List<Cinema>;
      final screens = snapshot.data![1] as List<Screen>;
      final shows = snapshot.data![2] as List<Showtime>;
      if (cinemas.isEmpty) {
        return const EmptyPanel(
          icon: Icons.location_city_outlined,
          message: 'No cinemas are available yet.',
        );
      }
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            for (final cinema in cinemas)
              Card(
                color: CinemaColors.card,
                margin: const EdgeInsets.only(bottom: 14),
                child: ExpansionTile(
                  leading: const Icon(
                    Icons.location_city,
                    color: CinemaColors.accent,
                  ),
                  title: Text(cinema.name),
                  subtitle: Text('${cinema.city}, ${cinema.country}'),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        cinema.address,
                        style: const TextStyle(color: CinemaColors.muted),
                      ),
                    ),
                    const SizedBox(height: 10),
                    for (final screen in screens.where(
                      (item) => item.cinemaId == cinema.id,
                    ))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.tv_outlined, size: 20),
                        title: Text(screen.name),
                        subtitle: Text(
                          '${screen.format} · ${screen.rows} rows × ${screen.columns} seats',
                        ),
                      ),
                    for (final showtime in shows.where(
                      (item) => screens.any(
                        (screen) =>
                            screen.cinemaId == cinema.id &&
                            screen.id == item.screen.id,
                      ),
                    ))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(
                          Icons.schedule,
                          color: CinemaColors.gold,
                          size: 20,
                        ),
                        title: Text(
                          '${showtime.movie.title} · ${formatTime(showtime.startAt)}',
                        ),
                        subtitle: Text(
                          '${showtime.startAt.day}/${showtime.startAt.month} · ${showtime.screen.name}',
                        ),
                        trailing: Text(showtime.price.toStringAsFixed(2)),
                        onTap: () async {
                          final booked = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(
                              builder: (_) => BookingPage(
                                api: widget.api,
                                showtime: showtime,
                              ),
                            ),
                          );
                          if (booked == true && mounted) reload();
                        },
                      ),
                    if (cinema.phone.isNotEmpty)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Phone: ${cinema.phone}',
                          style: const TextStyle(color: CinemaColors.muted),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      );
    },
  );
}

class BookingsPage extends StatefulWidget {
  const BookingsPage({required this.api, super.key});

  final ApiClient api;

  @override
  State<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends State<BookingsPage> {
  late Future<List<Booking>> _bookings;

  Future<List<Booking>> _load() async {
    final result = await widget.api.get('/bookings/me');
    return (result['bookings'] as List<dynamic>)
        .map((item) => Booking.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _bookings = _load();
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _bookings = next);
    await next;
  }

  void reload() {
    setState(() {
      _bookings = _load();
    });
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<Booking>>(
    future: _bookings,
    builder: (context, snapshot) {
      if (snapshot.hasError) {
        return ErrorPanel(error: snapshot.error!, onRetry: _refresh);
      }
      if (!snapshot.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.data!.isEmpty) {
        return const EmptyPanel(
          icon: Icons.confirmation_number_outlined,
          message: 'Your bookings will appear here.',
        );
      }
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            for (final booking in snapshot.data!)
              Card(
                color: CinemaColors.card,
                child: ListTile(
                  leading: const Icon(
                    Icons.local_activity_outlined,
                    color: CinemaColors.accent,
                  ),
                  title: Text(booking.showtime.movie.title),
                  subtitle: Text(
                    '${booking.showtime.startAt.day}/${booking.showtime.startAt.month} ${formatTime(booking.showtime.startAt)} · ${booking.seats.join(', ')}',
                  ),
                  trailing: Text(booking.total.toStringAsFixed(2)),
                ),
              ),
          ],
        ),
      );
    },
  );
}

class BookingPage extends StatefulWidget {
  const BookingPage({required this.api, required this.showtime, super.key});

  final ApiClient api;
  final Showtime showtime;

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  final Set<String> _selected = {};
  bool _busy = false;

  String _seatName(int row, int column) =>
      '${String.fromCharCode(65 + row)}${column + 1}';

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await widget.api.post('/bookings', {
        'showtimeId': widget.showtime.id,
        'seats': _selected.toList(),
      });
      if (!mounted) return;
      showMessage(context, 'Booking confirmed and saved.');
      Navigator.pop(context, true);
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screen = widget.showtime.screen;
    return Scaffold(
      appBar: AppBar(title: const Text('Choose your seats')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            widget.showtime.movie.title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            '${screen.name} · ${widget.showtime.startAt.day}/${widget.showtime.startAt.month} ${formatTime(widget.showtime.startAt)}',
            style: const TextStyle(color: CinemaColors.muted),
          ),
          const SizedBox(height: 24),
          Container(
            height: 5,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: CinemaColors.accent.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'SCREEN',
            textAlign: TextAlign.center,
            style: TextStyle(color: CinemaColors.muted, letterSpacing: 3),
          ),
          const SizedBox(height: 24),
          Center(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Column(
                children: [
                  for (var row = 0; row < screen.rows; row++)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          for (
                            var column = 0;
                            column < screen.columns;
                            column++
                          )
                            _SeatButton(
                              label: _seatName(row, column),
                              status:
                                  widget.showtime.bookedSeats.contains(
                                    _seatName(row, column),
                                  )
                                  ? 0
                                  : _selected.contains(_seatName(row, column))
                                  ? 2
                                  : 1,
                              onTap: () {
                                final seat = _seatName(row, column);
                                if (widget.showtime.bookedSeats.contains(
                                  seat,
                                )) {
                                  return;
                                }
                                setState(() {
                                  if (_selected.contains(seat)) {
                                    _selected.remove(seat);
                                  } else if (_selected.length < 8) {
                                    _selected.add(seat);
                                  }
                                });
                              },
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            '${_selected.length} seats · ${(widget.showtime.price * _selected.length).toStringAsFixed(2)}',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _selected.isEmpty || _busy ? null : _confirm,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Confirm booking'),
          ),
        ],
      ),
    );
  }
}

class _SeatButton extends StatelessWidget {
  const _SeatButton({
    required this.label,
    required this.status,
    required this.onTap,
  });

  final String label;
  final int status;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      0 => CinemaColors.border,
      2 => CinemaColors.accent,
      _ => const Color(0xFF343448),
    };
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: InkWell(
        onTap: onTap,
        child: Container(
          width: 32,
          height: 30,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(7),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 8, color: CinemaColors.text),
          ),
        ),
      ),
    );
  }
}

class AdminPage extends StatefulWidget {
  const AdminPage({required this.api, super.key});

  final ApiClient api;

  @override
  State<AdminPage> createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> {
  late Future<Map<String, dynamic>> _summary;

  @override
  void initState() {
    super.initState();
    _summary = widget.api.get('/admin/summary');
  }

  void reload() {
    setState(() {
      _summary = widget.api.get('/admin/summary');
    });
  }

  Future<void> _openForm(String kind) async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => AdminResourceForm(api: widget.api, kind: kind),
      ),
    );
    if (saved == true && mounted) {
      reload();
    }
  }

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      FutureBuilder<Map<String, dynamic>>(
        future: _summary,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return ErrorPanel(error: snapshot.error!, onRetry: reload);
          }
          if (!snapshot.hasData) {
            return const LinearProgressIndicator();
          }
          return Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final entry in snapshot.data!.entries)
                _SummaryCard(label: entry.key, value: entry.value.toString()),
            ],
          );
        },
      ),
      const SizedBox(height: 24),
      const SectionTitle('ADD TO CINÉMA'),
      const SizedBox(height: 8),
      for (final entry in const [
        ('Movie', Icons.movie_creation_outlined),
        ('Cinema', Icons.location_city_outlined),
        ('Screen', Icons.tv_outlined),
        ('Showtime', Icons.schedule),
      ])
        Card(
          color: CinemaColors.card,
          child: ListTile(
            leading: Icon(entry.$2, color: CinemaColors.accent),
            title: Text('Add ${entry.$1.toLowerCase()}'),
            trailing: const Icon(Icons.add),
            onTap: () => _openForm(entry.$1),
          ),
        ),
      const Padding(
        padding: EdgeInsets.only(top: 14),
        child: Text(
          'New movies, cinemas, screens, and showtimes are stored in MongoDB.',
          style: TextStyle(color: CinemaColors.muted),
        ),
      ),
    ],
  );
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
    width: 106,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: CinemaColors.card,
      borderRadius: BorderRadius.circular(14),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: const TextStyle(color: CinemaColors.muted, fontSize: 12),
        ),
      ],
    ),
  );
}

class AdminResourceForm extends StatefulWidget {
  const AdminResourceForm({required this.api, required this.kind, super.key});

  final ApiClient api;
  final String kind;

  @override
  State<AdminResourceForm> createState() => _AdminResourceFormState();
}

class _AdminResourceFormState extends State<AdminResourceForm> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _fields = {};
  List<Cinema> _cinemas = [];
  List<Movie> _movies = [];
  List<Screen> _screens = [];
  String? _cinemaId;
  String? _movieId;
  String? _screenId;
  bool _featured = false;
  bool _loadingOptions = false;
  bool _saving = false;
  DateTime _startAt = DateTime.now().add(const Duration(days: 1));

  TextEditingController _field(String name) =>
      _fields.putIfAbsent(name, () => TextEditingController());

  @override
  void initState() {
    super.initState();
    if (widget.kind == 'Screen' || widget.kind == 'Showtime') {
      _loadOptions();
    }
  }

  Future<void> _loadOptions() async {
    setState(() => _loadingOptions = true);
    try {
      final responses = await Future.wait([
        widget.api.get('/cinemas'),
        widget.api.get('/movies'),
        widget.api.get('/screens'),
      ]);
      if (!mounted) return;
      setState(() {
        _cinemas = (responses[0]['cinemas'] as List<dynamic>)
            .map((item) => Cinema.fromJson(item as Map<String, dynamic>))
            .toList();
        _movies = (responses[1]['movies'] as List<dynamic>)
            .map((item) => Movie.fromJson(item as Map<String, dynamic>))
            .toList();
        _screens = (responses[2]['screens'] as List<dynamic>)
            .map((item) => Screen.fromJson(item as Map<String, dynamic>))
            .toList();
        _cinemaId = _cinemas.isEmpty ? null : _cinemas.first.id;
        _movieId = _movies.isEmpty ? null : _movies.first.id;
        _screenId = _screens.isEmpty ? null : _screens.first.id;
      });
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    } finally {
      if (mounted) setState(() => _loadingOptions = false);
    }
  }

  @override
  void dispose() {
    for (final controller in _fields.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required' : null;

  String? _integerRange(String? value, int minimum, int maximum) {
    final parsed = int.tryParse(value ?? '');
    if (parsed == null) return 'Enter a whole number';
    if (parsed < minimum || parsed > maximum) {
      return 'Enter a value from $minimum to $maximum';
    }
    return null;
  }

  String? _numberRange(String? value, double minimum, double maximum) {
    final parsed = double.tryParse(value ?? '');
    if (parsed == null) return 'Enter a number';
    if (parsed < minimum || parsed > maximum) {
      return 'Enter a value from $minimum to $maximum';
    }
    return null;
  }

  Widget _textField(
    String name,
    String label, {
    TextInputType keyboard = TextInputType.text,
    int maxLines = 1,
    String? initialValue,
    bool optional = false,
    String? Function(String?)? validator,
  }) {
    final controller = _field(name);
    if (initialValue != null && controller.text.isEmpty) {
      controller.text = initialValue;
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        validator: validator ?? (optional ? null : _required),
      ),
    );
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startAt,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startAt),
    );
    if (time == null) return;
    setState(() {
      _startAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      late String path;
      late Map<String, dynamic> body;
      if (widget.kind == 'Movie') {
        path = '/movies';
        body = {
          'title': _field('title').text.trim(),
          'genre': _field('genre').text.trim(),
          'year': int.parse(_field('year').text),
          'rating': double.parse(_field('rating').text),
          'durationMinutes': int.parse(_field('duration').text),
          'description': _field('description').text.trim(),
          'posterUrl': _field('poster').text.trim(),
          'cast': _field('cast').text
              .split(',')
              .map((name) => name.trim())
              .where((name) => name.isNotEmpty)
              .toList(),
          'isFeatured': _featured,
        };
      } else if (widget.kind == 'Cinema') {
        path = '/cinemas';
        body = {
          'name': _field('name').text.trim(),
          'address': _field('address').text.trim(),
          'city': _field('city').text.trim(),
          'country': _field('country').text.trim(),
          'phone': _field('phone').text.trim(),
        };
      } else if (widget.kind == 'Screen') {
        path = '/screens';
        body = {
          'cinema': _cinemaId,
          'name': _field('name').text.trim(),
          'rows': int.parse(_field('rows').text),
          'columns': int.parse(_field('columns').text),
          'seatPrice': double.parse(_field('price').text),
          'format': _field('format').text.trim(),
        };
      } else {
        path = '/showtimes';
        body = {
          'movie': _movieId,
          'screen': _screenId,
          'startAt': _startAt.toUtc().toIso8601String(),
          'price': double.parse(_field('price').text),
        };
      }
      await widget.api.post(path, body);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message);
    } on FormatException {
      if (mounted) {
        showMessage(context, 'Enter valid numbers in numeric fields.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kind = widget.kind;
    final waitingForOptions =
        (kind == 'Screen' || kind == 'Showtime') &&
        (_loadingOptions ||
            _cinemas.isEmpty ||
            (kind == 'Showtime' && (_movies.isEmpty || _screens.isEmpty)));
    return Scaffold(
      appBar: AppBar(title: Text('Add $kind')),
      body: _loadingOptions
          ? const Center(child: CircularProgressIndicator())
          : waitingForOptions
          ? EmptyPanel(
              icon: Icons.info_outline,
              message: kind == 'Screen'
                  ? 'Add a cinema before creating a screen.'
                  : 'Add a movie, cinema, and screen before creating a showtime.',
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  if (kind == 'Movie') ...[
                    _textField('title', 'Movie title'),
                    _textField('genre', 'Genre'),
                    _textField(
                      'year',
                      'Release year',
                      keyboard: TextInputType.number,
                      initialValue: DateTime.now().year.toString(),
                      validator: (value) => _integerRange(value, 1888, 2200),
                    ),
                    _textField(
                      'duration',
                      'Duration (minutes)',
                      keyboard: TextInputType.number,
                      initialValue: '120',
                      validator: (value) => _integerRange(value, 1, 600),
                    ),
                    _textField(
                      'rating',
                      'Rating out of 10',
                      keyboard: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      initialValue: '0',
                      validator: (value) => _numberRange(value, 0, 10),
                    ),
                    _textField('description', 'Synopsis', maxLines: 4),
                    _textField(
                      'poster',
                      'Poster URL (optional)',
                      optional: true,
                    ),
                    _textField(
                      'cast',
                      'Cast (comma separated)',
                      optional: true,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Feature this movie'),
                      value: _featured,
                      onChanged: (value) => setState(() => _featured = value),
                    ),
                  ],
                  if (kind == 'Cinema') ...[
                    _textField('name', 'Cinema name'),
                    _textField('address', 'Street address'),
                    _textField('city', 'City'),
                    _textField('country', 'Country'),
                    _textField('phone', 'Phone (optional)', optional: true),
                  ],
                  if (kind == 'Screen') ...[
                    DropdownButtonFormField<String>(
                      initialValue: _cinemaId,
                      decoration: const InputDecoration(labelText: 'Cinema'),
                      items: [
                        for (final cinema in _cinemas)
                          DropdownMenuItem(
                            value: cinema.id,
                            child: Text(cinema.name),
                          ),
                      ],
                      onChanged: (value) => setState(() => _cinemaId = value),
                    ),
                    const SizedBox(height: 14),
                    _textField('name', 'Screen name'),
                    _textField(
                      'rows',
                      'Seat rows (1-26)',
                      keyboard: TextInputType.number,
                      initialValue: '8',
                      validator: (value) => _integerRange(value, 1, 26),
                    ),
                    _textField(
                      'columns',
                      'Seats per row (1-30)',
                      keyboard: TextInputType.number,
                      initialValue: '10',
                      validator: (value) => _integerRange(value, 1, 30),
                    ),
                    _textField(
                      'price',
                      'Seat price',
                      keyboard: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      initialValue: '12',
                      validator: (value) => _numberRange(value, 0, 10000),
                    ),
                    _textField('format', 'Format', initialValue: 'Standard'),
                  ],
                  if (kind == 'Showtime') ...[
                    DropdownButtonFormField<String>(
                      initialValue: _movieId,
                      decoration: const InputDecoration(labelText: 'Movie'),
                      items: [
                        for (final movie in _movies)
                          DropdownMenuItem(
                            value: movie.id,
                            child: Text(movie.title),
                          ),
                      ],
                      onChanged: (value) => setState(() => _movieId = value),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: _cinemaId,
                      decoration: const InputDecoration(labelText: 'Cinema'),
                      items: [
                        for (final cinema in _cinemas)
                          DropdownMenuItem(
                            value: cinema.id,
                            child: Text(cinema.name),
                          ),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _cinemaId = value;
                          final available = _screens.where(
                            (screen) => screen.cinemaId == value,
                          );
                          _screenId = available.isEmpty
                              ? null
                              : available.first.id;
                        });
                      },
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      key: ValueKey(_screenId),
                      initialValue:
                          _screens.any(
                            (screen) =>
                                screen.id == _screenId &&
                                screen.cinemaId == _cinemaId,
                          )
                          ? _screenId
                          : null,
                      decoration: const InputDecoration(labelText: 'Screen'),
                      items: [
                        for (final screen in _screens.where(
                          (screen) => screen.cinemaId == _cinemaId,
                        ))
                          DropdownMenuItem(
                            value: screen.id,
                            child: Text(screen.name),
                          ),
                      ],
                      validator: (value) =>
                          value == null ? 'Select a screen' : null,
                      onChanged: (value) => setState(() => _screenId = value),
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _pickDateTime,
                      icon: const Icon(Icons.calendar_month),
                      label: Text(
                        '${_startAt.day}/${_startAt.month}/${_startAt.year} ${formatTime(_startAt)}',
                      ),
                    ),
                    const SizedBox(height: 14),
                    _textField(
                      'price',
                      'Ticket price',
                      keyboard: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      initialValue: '12',
                      validator: (value) => _numberRange(value, 0, 10000),
                    ),
                  ],
                  const SizedBox(height: 18),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save to MongoDB'),
                  ),
                ],
              ),
            ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: CinemaColors.muted,
      letterSpacing: 1.5,
      fontWeight: FontWeight.w600,
      fontSize: 12,
    ),
  );
}

class EmptyPanel extends StatelessWidget {
  const EmptyPanel({required this.icon, required this.message, super.key});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 42, color: CinemaColors.muted),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: CinemaColors.muted),
          ),
        ],
      ),
    ),
  );
}

class ErrorPanel extends StatelessWidget {
  const ErrorPanel({required this.error, required this.onRetry, super.key});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.cloud_off_outlined,
            color: CinemaColors.accent,
            size: 40,
          ),
          const SizedBox(height: 12),
          Text(
            error.toString(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: CinemaColors.muted),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}

String formatTime(DateTime dateTime) {
  final hour = dateTime.hour % 12 == 0 ? 12 : dateTime.hour % 12;
  final minute = dateTime.minute.toString().padLeft(2, '0');
  return '$hour:$minute ${dateTime.hour < 12 ? 'AM' : 'PM'}';
}

void showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}
