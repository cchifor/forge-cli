import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../api/client/dio_client.dart';
import '../../../core/storage/secure_storage_provider.dart';
import '../domain/auth_state.dart';
import '../domain/user_model.dart';
import 'dev_auth_service.dart';
import 'keycloak_auth_service.dart';

part 'auth_repository.g.dart';

class AuthRepository {
  AuthRepository({
    DevAuthService? devService,
    KeycloakAuthService? keycloakService,
    required bool authDisabled,
  })  : _devService = devService,
        _keycloakService = keycloakService,
        _authDisabled = authDisabled;

  final DevAuthService? _devService;
  final KeycloakAuthService? _keycloakService;
  final bool _authDisabled;

  String? _accessToken;

  String? get accessToken => _accessToken;

  Future<AuthState> init() async {
    if (_authDisabled) {
      final dev = _devService!;
      final user = await dev.init();
      _accessToken = dev.accessToken;
      return user != null
          ? AuthState.authenticated(
              user: user,
              accessToken: _accessToken ?? '',
            )
          : const AuthState.unauthenticated();
    }

    final kc = _keycloakService!;
    final user = await kc.init();
    _accessToken = kc.accessToken;
    return user != null
        ? AuthState.authenticated(
            user: user,
            accessToken: _accessToken ?? '',
          )
        : const AuthState.unauthenticated();
  }

  Future<AuthState> login() async {
    if (_authDisabled) {
      final (user, tokenPair) = await _devService!.login();
      _accessToken = tokenPair.accessToken;
      return AuthState.authenticated(user: user, accessToken: _accessToken!);
    }

    final (user, tokenPair) = await _keycloakService!.login();
    _accessToken = tokenPair.accessToken;
    return AuthState.authenticated(user: user, accessToken: _accessToken!);
  }

  Future<void> logout() async {
    _accessToken = null;
    if (_authDisabled) {
      await _devService!.logout();
    } else {
      await _keycloakService!.logout();
    }
  }

  User? get currentUser => _authDisabled
      ? _devService?.currentUser
      : _keycloakService?.currentUser;
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) {
  final config = ref.watch(envConfigProvider);
  if (config.authDisabled) {
    return AuthRepository(
      devService: DevAuthService(),
      authDisabled: true,
    );
  }
  return AuthRepository(
    keycloakService: KeycloakAuthService(
      config: config,
      secureStorage: ref.watch(secureStorageProvider),
    ),
    authDisabled: false,
  );
}
