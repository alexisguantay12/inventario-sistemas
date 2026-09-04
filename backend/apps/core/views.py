from django.contrib.auth import (
    authenticate,
    login,
    logout,
)

from django.views.decorators.csrf import (
    ensure_csrf_cookie,
)

from django.utils.decorators import (
    method_decorator,
)

from rest_framework import status

from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)

from rest_framework.response import Response

from rest_framework.views import APIView

from .serializers import LoginSerializer


# ============================================================
# CSRF
# ============================================================


@method_decorator(
    ensure_csrf_cookie,
    name="dispatch",
)
class CsrfView(APIView):
    """
    Fuerza la creación de la cookie CSRF.

    El frontend debe llamar este endpoint antes del login
    y antes de cualquier operación que requiera CSRF.
    """

    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    def get(self, request):
        return Response(
            {
                "detail": "CSRF cookie generada.",
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# LOGIN
# ============================================================


class LoginView(APIView):
    """
    Inicia sesión utilizando el sistema de sesiones de Django.
    """

    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        username = serializer.validated_data[
            "username"
        ]

        password = serializer.validated_data[
            "password"
        ]

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "detail": (
                        "Usuario o contraseña incorrectos."
                    ),
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "detail": (
                        "El usuario se encuentra inactivo."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        login(
            request,
            user,
        )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "nombre_completo": (
                    user.get_full_name()
                    or user.username
                ),
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# LOGOUT
# ============================================================


class LogoutView(APIView):
    """
    Cierra la sesión actual.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        logout(request)

        return Response(
            {
                "detail": (
                    "Sesión cerrada correctamente."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# USUARIO ACTUAL
# ============================================================


class MeView(APIView):
    """
    Devuelve el usuario autenticado actualmente.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        user = request.user

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "nombre_completo": (
                    user.get_full_name()
                    or user.username
                ),
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            status=status.HTTP_200_OK,
        )