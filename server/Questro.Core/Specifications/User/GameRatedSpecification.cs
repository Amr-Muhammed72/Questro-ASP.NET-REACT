using Questro.Core.Entities.Games;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Core.Specifications.User
{
    public class GameRatedSpecification : BaseSpecification<UserGameRate>
    {
        public GameRatedSpecification(long userId)
        : base( x=> x.UserId == userId )
        {
        }
    }
}
