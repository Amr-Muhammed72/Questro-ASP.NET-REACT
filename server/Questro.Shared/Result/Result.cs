
using System;
using Questro.Shared.ErrorHandle;
using ErrorType = Questro.Shared.ErrorHandle.Error;
namespace Questro.Shared.Result;

public class Result
{
    public Result(bool isSuccess, ErrorType.Errors error)
    {
        if ((isSuccess && error != ErrorType.Errors.None) || (!isSuccess && error == ErrorType.Errors.None))
            throw new InvalidOperationException();

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public ErrorType.Errors Error { get; } = default!;

    public static Result Success() => new(true, ErrorType.Errors.None);
    public static Result Failure(ErrorType.Errors error) => new(false, error);

    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, ErrorType.Errors.None);
    public static Result<TValue> Failure<TValue>(ErrorType.Errors error) => new(default, false, error);

  
}

public class Result<TValue> : Result
{
    private readonly TValue? _value;

    public Result(TValue? value, bool isSuccess, ErrorType.Errors error) : base(isSuccess, error)
    {
        if (isSuccess && value == null)
            throw new ArgumentNullException(nameof(value), "Success results cannot have a null value.");

        _value = value;
    }


    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Failure results cannot have value");

}
