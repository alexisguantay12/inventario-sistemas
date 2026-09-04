from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        required=True,
        allow_blank=False,
    )

    password = serializers.CharField(
        required=True,
        allow_blank=False,
        write_only=True,
        trim_whitespace=False,
    )