class EnvConfig {
  const EnvConfig({
    this.apiBaseUrl = '{{api_base_url}}',
{%- if include_auth %}
    this.authDisabled = true,
    this.keycloakUrl = '{{keycloak_url}}',
    this.keycloakRealm = '{{keycloak_realm}}',
    this.keycloakClientId = '{{keycloak_client_id}}',
{%- endif %}
  });

  factory EnvConfig.fromEnvironment() {
    return const EnvConfig(
      apiBaseUrl: String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: '{{api_base_url}}',
      ),
{%- if include_auth %}
      authDisabled: bool.fromEnvironment(
        'AUTH_DISABLED',
        defaultValue: true,
      ),
      keycloakUrl: String.fromEnvironment(
        'KEYCLOAK_URL',
        defaultValue: '{{keycloak_url}}',
      ),
      keycloakRealm: String.fromEnvironment(
        'KEYCLOAK_REALM',
        defaultValue: '{{keycloak_realm}}',
      ),
      keycloakClientId: String.fromEnvironment(
        'KEYCLOAK_CLIENT_ID',
        defaultValue: '{{keycloak_client_id}}',
      ),
{%- endif %}
    );
  }

  final String apiBaseUrl;
{%- if include_auth %}
  final bool authDisabled;
  final String keycloakUrl;
  final String keycloakRealm;
  final String keycloakClientId;

  bool get isDevelopment => authDisabled;

  String get keycloakAuthUrl =>
      '$keycloakUrl/realms/$keycloakRealm/protocol/openid-connect/auth';

  String get keycloakTokenUrl =>
      '$keycloakUrl/realms/$keycloakRealm/protocol/openid-connect/token';

  String get keycloakLogoutUrl =>
      '$keycloakUrl/realms/$keycloakRealm/protocol/openid-connect/logout';
{%- endif %}
}
