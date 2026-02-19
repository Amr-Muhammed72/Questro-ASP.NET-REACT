
namespace Questro.Shared.ErrorHandle;
public class Error
{
    public record Errors(string Code, string en, string ar, int? StatusCode)
    {

        public string Description => en;
        
        public static readonly Errors None = new(string.Empty, string.Empty, string.Empty, null);
    }
}
