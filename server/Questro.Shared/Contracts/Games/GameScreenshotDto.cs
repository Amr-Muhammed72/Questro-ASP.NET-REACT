using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.Games
{
    public class GameScreenshotDto
    {
        public int? Id { get; set; }
        public string? ImageUrl { get; set; } = string.Empty;
        public int? width { get; set; }
        public int? height { get; set; }

    }
}
