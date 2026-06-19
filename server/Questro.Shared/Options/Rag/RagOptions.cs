namespace Questro.Shared.Options.Rag;

public sealed class RagOptions
{
    public const string SectionName = "RagService";

    public string Url { get; set; } = "https://bluocaroot-questro-rag.hf.space";
    public int TimeoutSeconds { get; set; } = 60;
}
