using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Users;

public static class UserError
{
    public static readonly Errors InvalidRegistrationData =
        new("User.InvalidRegistrationData", "Invalid registration data.", 400);

    public static readonly Errors PasswordsDoNotMatch =
        new("User.PasswordsDoNotMatch", "Password and confirm password do not match.", 400);

    public static readonly Errors EmailAlreadyExists =
        new("User.EmailAlreadyExists", "Email is already registered.", 409);

    public static readonly Errors UserNameAlreadyExists =
        new("User.UserNameAlreadyExists", "Username is already taken.", 409);

    public static readonly Errors RegistrationFailed =
        new("User.RegistrationFailed", "Failed to register user.", 500);

    public static readonly Errors InvalidRefreshToken =
        new("User.InvalidRefreshToken", "Invalid or expired refresh token.", 401);
}