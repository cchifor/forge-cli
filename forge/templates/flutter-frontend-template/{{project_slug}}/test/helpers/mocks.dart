import 'package:dio/dio.dart';
import 'package:{{project_slug}}/src/features/auth/data/auth_repository.dart';
import 'package:{{project_slug}}/src/features/home/data/home_repository.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockHomeRepository extends Mock implements HomeRepository {}
