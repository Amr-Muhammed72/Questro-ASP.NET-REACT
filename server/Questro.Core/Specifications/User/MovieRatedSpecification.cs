using Questro.Core.Entities.Movies;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Core.Specifications.User
{
    public class MovieRatedSpecification : BaseSpecification<UserMovieRate>

    {
        public MovieRatedSpecification(long userId) : base(x=>x.UserId == userId) {
        
        }
    }
}
