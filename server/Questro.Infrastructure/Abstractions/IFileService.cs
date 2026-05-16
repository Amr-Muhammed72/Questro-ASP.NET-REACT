namespace Questro.Infrastructure.Abstractions;

public interface IFileService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string subfolder, CancellationToken cancellationToken = default);
    void DeleteFile(string relativePath);
}
