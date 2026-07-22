package service

import (
	"context"

	v1 "template-v6/server/admin-service/api/system/v1"
	"template-v6/server/admin-service/internal/biz"

	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// UserService is the system user management service.
type UserService struct {
	v1.UnimplementedUserServiceServer

	uc *biz.UserUsecase
}

// NewUserService creates a UserService.
func NewUserService(uc *biz.UserUsecase) *UserService {
	return &UserService{uc: uc}
}

func (s *UserService) ListUsers(ctx context.Context, _ *v1.ListUsersRequest) (*v1.ListUsersReply, error) {
	users, err := s.uc.ListUsers(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.ListUsersReply{Data: convertUserReplies(users)}, nil
}

func (s *UserService) GetUser(ctx context.Context, req *v1.GetUserRequest) (*v1.User, error) {
	user, err := s.uc.GetUser(ctx, bearerToken(ctx), req.GetId())
	if err != nil {
		return nil, err
	}
	return convertUserReply(user), nil
}

func (s *UserService) CreateUser(ctx context.Context, req *v1.CreateUserRequest) (*v1.User, error) {
	user, err := s.uc.CreateUser(ctx, bearerToken(ctx), &biz.User{
		Username:    req.GetUsername(),
		DisplayName: req.GetDisplayName(),
		Avatar:      req.GetAvatar(),
		Email:       req.GetEmail(),
		Phone:       req.GetPhone(),
		Status:      req.GetStatus(),
		RoleIDs:     req.GetRoleIds(),
	}, req.GetPassword())
	if err != nil {
		return nil, err
	}
	return convertUserReply(user), nil
}

func (s *UserService) UpdateUser(ctx context.Context, req *v1.UpdateUserRequest) (*v1.User, error) {
	user, err := s.uc.UpdateUser(ctx, bearerToken(ctx), req.GetId(), &biz.User{
		DisplayName: req.GetDisplayName(),
		Avatar:      req.GetAvatar(),
		Email:       req.GetEmail(),
		Phone:       req.GetPhone(),
		Status:      req.GetStatus(),
	})
	if err != nil {
		return nil, err
	}
	return convertUserReply(user), nil
}

func (s *UserService) DeleteUser(ctx context.Context, req *v1.DeleteUserRequest) (*emptypb.Empty, error) {
	if err := s.uc.DeleteUser(ctx, bearerToken(ctx), req.GetId()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (s *UserService) ResetUserPassword(ctx context.Context, req *v1.ResetUserPasswordRequest) (*emptypb.Empty, error) {
	if err := s.uc.ResetPassword(ctx, bearerToken(ctx), req.GetId(), req.GetPassword()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (s *UserService) UpdateUserRoles(ctx context.Context, req *v1.UpdateUserRolesRequest) (*v1.User, error) {
	user, err := s.uc.UpdateUserRoles(ctx, bearerToken(ctx), req.GetId(), req.GetRoleIds())
	if err != nil {
		return nil, err
	}
	return convertUserReply(user), nil
}

func convertUserReplies(users []*biz.User) []*v1.User {
	result := make([]*v1.User, 0, len(users))
	for _, user := range users {
		result = append(result, convertUserReply(user))
	}
	return result
}

func convertUserReply(user *biz.User) *v1.User {
	if user == nil {
		return nil
	}
	return &v1.User{
		Id:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Avatar:      user.Avatar,
		Email:       user.Email,
		Phone:       user.Phone,
		Status:      user.Status,
		RoleIds:     append([]string(nil), user.RoleIDs...),
		RoleCodes:   append([]string(nil), user.RoleCodes...),
		CreatedAt:   timestamppb.New(user.CreatedAt),
		UpdatedAt:   timestamppb.New(user.UpdatedAt),
	}
}
