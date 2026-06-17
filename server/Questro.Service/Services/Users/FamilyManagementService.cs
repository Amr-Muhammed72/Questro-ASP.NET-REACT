using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Family;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Family;
using Questro.Shared.ErrorHandle.Family;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;

namespace Questro.Service.Services.Users;

public class FamilyManagementService : IFamilyManagementService
{
	private readonly UserManager<ApplicationUser> _userManager;
	private readonly IGenericRepository<ChildRestriction> _restrictionRepo;
	private readonly IUserCleanupRepository _cleanupRepo;
	private readonly IFamilyRepository _familyRepo;
	private readonly IUnitOfWork _unitOfWork;

	public FamilyManagementService(
		UserManager<ApplicationUser> userManager,
		IGenericRepository<ChildRestriction> restrictionRepo,
		IUserCleanupRepository cleanupRepo,
		IFamilyRepository familyRepo,
		IUnitOfWork unitOfWork)
	{
		_userManager = userManager;
		_restrictionRepo = restrictionRepo;
		_cleanupRepo = cleanupRepo;
		_familyRepo = familyRepo;
		_unitOfWork = unitOfWork;
	}

	public async Task<Result<ChildAccountResponseDto>> CreateChildAccountAsync(
		long parentId, CreateChildAccountRequestDto request, CancellationToken cancellationToken = default)
	{
		// 1. Validate parent exists and is not a child account
		var parent = await _userManager.FindByIdAsync(parentId.ToString());
		if (parent is null)
			return Result.Failure<ChildAccountResponseDto>(UserError.UserNotFound);

		if (parent.IsChildAccount)
			return Result.Failure<ChildAccountResponseDto>(FamilyError.ChildCannotHaveChildren);

		// 2. Validate passwords match
		if (request.Password != request.ConfirmPassword)
			return Result.Failure<ChildAccountResponseDto>(UserError.PasswordsDoNotMatch);

		// 3. Create child user via Identity
		var child = new ApplicationUser
		{
			UserName = request.UserName,
			Email = request.Email,
			FirstName = request.FirstName,
			LastName = request.LastName,
			BirthDate = request.BirthDate,
			ParentId = parentId,
			JoinDate = DateTime.UtcNow,
			IsHistoryPublic = false,
			IsProfileCompleted = true,
			EmailConfirmed = true
		};

		var createResult = await _userManager.CreateAsync(child, request.Password);
		if (!createResult.Succeeded)
		{
			var errors = createResult.Errors.Select(e => e.Description).ToList();

			if (createResult.Errors.Any(e => e.Code == "DuplicateUserName"))
				return Result.Failure<ChildAccountResponseDto>(UserError.UserNameAlreadyExists, errors);

			if (createResult.Errors.Any(e => e.Code == "DuplicateEmail"))
				return Result.Failure<ChildAccountResponseDto>(UserError.EmailAlreadyExists, errors);

			return Result.Failure<ChildAccountResponseDto>(FamilyError.CreateChildFailed, errors);
		}

		// 4. Create the child's restriction record
		var restriction = new ChildRestriction
		{
			UserId = child.Id,
			BlockedMovieGenreIds = request.BlockedMovieGenreIds ?? new(),
			BlockedGameGenreIds = request.BlockedGameGenreIds ?? new()
		};

		await _restrictionRepo.AddAsync(restriction, cancellationToken);
		await _unitOfWork.CompleteAsync(cancellationToken);

		return Result.Success(MapToResponse(child, restriction));
	}

	public async Task<Result<IEnumerable<ChildAccountResponseDto>>> GetChildrenAsync(
		long parentId, CancellationToken cancellationToken = default)
	{
		var parent = await _userManager.FindByIdAsync(parentId.ToString());
		if (parent is null)
			return Result.Failure<IEnumerable<ChildAccountResponseDto>>(UserError.UserNotFound);

		// Query children via IFamilyRepository
		var children = await _familyRepo.GetChildrenByParentIdAsync(parentId, cancellationToken);

		// Load each child's restrictions
		var results = new List<ChildAccountResponseDto>(children.Count);
		foreach (var child in children)
		{
			var spec = new ChildRestrictionByUserIdSpecification(child.Id);
			var restriction = await _restrictionRepo.GetEntityWithSpecAsync(spec, cancellationToken);
			results.Add(MapToResponse(child, restriction));
		}

		return Result.Success<IEnumerable<ChildAccountResponseDto>>(results);
	}

	public async Task<Result<ChildRestrictionDto>> UpdateChildRestrictionsAsync(
		long parentId, long childId, ChildRestrictionDto request, CancellationToken cancellationToken = default)
	{
		// 1. Validate child exists and belongs to parent
		var child = await _userManager.FindByIdAsync(childId.ToString());
		if (child is null)
			return Result.Failure<ChildRestrictionDto>(FamilyError.ChildNotFound);

		if (child.ParentId != parentId)
			return Result.Failure<ChildRestrictionDto>(FamilyError.ChildNotOwned);

		// 2. Find or create restriction
		var spec = new ChildRestrictionByUserIdSpecification(childId);
		var restriction = await _restrictionRepo.GetEntityWithSpecAsync(spec, cancellationToken);

		if (restriction is null)
		{
			restriction = new ChildRestriction
			{
				UserId = childId,
				BlockedMovieGenreIds = request.BlockedMovieGenreIds ?? new(),
				BlockedGameGenreIds = request.BlockedGameGenreIds ?? new()
			};
			await _restrictionRepo.AddAsync(restriction, cancellationToken);
		}
		else
		{
			restriction.BlockedMovieGenreIds = request.BlockedMovieGenreIds ?? new();
			restriction.BlockedGameGenreIds = request.BlockedGameGenreIds ?? new();
			_restrictionRepo.Update(restriction);
		}

		await _unitOfWork.CompleteAsync(cancellationToken);

		return Result.Success(MapToRestrictionDto(restriction));
	}

	public async Task<Result<ChildRestrictionDto?>> GetMyRestrictionsAsync(
		long userId, CancellationToken cancellationToken = default)
	{
		var user = await _userManager.FindByIdAsync(userId.ToString());
		if (user is null)
			return Result.Failure<ChildRestrictionDto?>(UserError.UserNotFound);

		if (!user.IsChildAccount)
			return Result.Success<ChildRestrictionDto?>(new ChildRestrictionDto());

		var spec = new ChildRestrictionByUserIdSpecification(userId);
		var restriction = await _restrictionRepo.GetEntityWithSpecAsync(spec, cancellationToken);

		return Result.Success<ChildRestrictionDto?>(
			restriction is not null ? MapToRestrictionDto(restriction) : null);
	}

	public async Task<Result> ChangeChildPasswordAsync(
		long parentId, long childId, ChangeChildPasswordRequestDto request, CancellationToken cancellationToken = default)
	{
		var child = await _userManager.FindByIdAsync(childId.ToString());
		if (child is null)
			return Result.Failure(FamilyError.ChildNotFound);

		if (child.ParentId != parentId)
			return Result.Failure(FamilyError.ChildNotOwned);

		var token = await _userManager.GeneratePasswordResetTokenAsync(child);
		var resetResult = await _userManager.ResetPasswordAsync(child, token, request.NewPassword);

		if (!resetResult.Succeeded)
		{
			var errors = resetResult.Errors.Select(e => e.Description).ToList();
			return Result.Failure(FamilyError.ChangePasswordFailed, errors);
		}

		return Result.Success();
	}

	public async Task<Result> DeleteChildAsync(
		long parentId, long childId, CancellationToken cancellationToken = default)
	{
		var child = await _userManager.FindByIdAsync(childId.ToString());
		if (child is null)
			return Result.Failure(FamilyError.ChildNotFound);

		if (child.ParentId != parentId)
			return Result.Failure(FamilyError.ChildNotOwned);

		// Wipe all interactions and restrictions using the high-performance cleanup repo
		await _cleanupRepo.WipeUserFootprintAsync(childId, cancellationToken);

		var deleteResult = await _userManager.DeleteAsync(child);
		if (!deleteResult.Succeeded)
		{
			var errors = deleteResult.Errors.Select(e => e.Description).ToList();
			return Result.Failure(FamilyError.DeleteChildFailed, errors);
		}

		return Result.Success();
	}

	private static ChildAccountResponseDto MapToResponse(ApplicationUser child, ChildRestriction? restriction)
	{
		return new ChildAccountResponseDto
		{
			UserId = child.Id,
			UserName = child.UserName ?? string.Empty,
			FirstName = child.FirstName,
			LastName = child.LastName,
			BirthDate = child.BirthDate,
			Restrictions = restriction is not null ? MapToRestrictionDto(restriction) : null
		};
	}

	private static ChildRestrictionDto MapToRestrictionDto(ChildRestriction restriction)
	{
		return new ChildRestrictionDto
		{
			BlockedMovieGenreIds = restriction.BlockedMovieGenreIds,
			BlockedGameGenreIds = restriction.BlockedGameGenreIds
		};
	}
}
