using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MovieWithFiltersForCountSpecification : BaseSpecification<Movie>
{
    public MovieWithFiltersForCountSpecification(MovieSpecCriteria specParams)
        : base(MovieSpecificationCriteriaBuilder.Build(specParams))
    {
    }
}