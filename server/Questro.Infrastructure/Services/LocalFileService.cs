using Questro.Infrastructure.Abstractions;

namespace Questro.Infrastructure.Services;

public class LocalFileService : IFileService
{
    private readonly string _basePath;

    public LocalFileService(string basePath)
    {
        _basePath = basePath;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string subfolder, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        if (!allowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var folderPath = Path.Combine(_basePath, "uploads", subfolder);

        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        var filePath = Path.Combine(folderPath, uniqueFileName);

        using var outputStream = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(outputStream, cancellationToken);

        return $"/uploads/{subfolder}/{uniqueFileName}";
    }

    public void DeleteFile(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return;

        var fullPath = Path.Combine(_basePath, relativePath.TrimStart('/'));

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}
