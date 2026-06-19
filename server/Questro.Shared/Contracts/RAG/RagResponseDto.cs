using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.RAG
{
    public record RagResponseDto(string? query, string status, string? error, string? llmResponse);
    public record RagRequestDto(string? query);
}
    
