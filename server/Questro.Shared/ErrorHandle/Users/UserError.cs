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
    // Login Errors 

    public static readonly Errors InvalidLogInData =
      new("User.InvalidLoginData", "Email and password are required.", 400);

    public static readonly Errors InvalidCredentials =
        new("User.InvalidCredentials", "Invalid email or password.", 401);

    public static readonly Errors LogInFailed =
        new("User.LoginFailed", "Failed to login user.", 500);
    public static readonly Errors UserLockedOut =
    new("User.LockedOut", "User is locked out. Try again later.", 403);

    public static readonly Errors LoginNotAllowed =
        new("User.LoginNotAllowed", "Login not allowed. Please confirm your email.", 403);
    // log out 
    public static readonly Errors LogoutFailed =
    new("User.LogoutFailed", "Failed to logout user.", 500);

    // Password Reset Errors
    public static readonly Errors UserNotFound =
        new("User.NotFound", "User not found.", 404);

    public static readonly Errors InvalidPasswordResetRequest =
        new("User.InvalidPasswordResetRequest", "Invalid password reset request.", 400);

    public static readonly Errors PasswordResetFailed =
        new("User.PasswordResetFailed", "Failed to reset password.", 500);

    public static readonly Errors PasswordResetExpired =
        new("User.PasswordResetExpired", "Password reset token has expired.", 401);
    // External Login Errors
        public static readonly Errors ExternalLoginFailed =
            new("User.ExternalLoginFailed", "Failed to login with external provider.", 500);
    
        public static readonly Errors ExternalLoginEmailNotFound =
            new("User.ExternalLoginEmailNotFound", "Email not found in external login data.", 400);
    
        public static readonly Errors ExternalLoginProviderNotSupported =
            new("User.ExternalLoginProviderNotSupported", "External login provider is not supported.", 400);
}