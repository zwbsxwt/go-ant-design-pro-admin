package service

import (
	"bytes"
	"context"
	"io"
	"net/http"

	v1 "template-v6/server/admin-service/api/profile/v1"
	"template-v6/server/admin-service/internal/biz"

	khttp "github.com/go-kratos/kratos/v3/transport/http"
	"google.golang.org/protobuf/types/known/emptypb"
)

// ProfileService is the current-user profile service.
type ProfileService struct {
	v1.UnimplementedProfileServiceServer

	uc *biz.ProfileUsecase
}

// NewProfileService creates a ProfileService.
func NewProfileService(uc *biz.ProfileUsecase) *ProfileService {
	return &ProfileService{uc: uc}
}

func (s *ProfileService) GetProfile(ctx context.Context, _ *v1.GetProfileRequest) (*v1.GetProfileReply, error) {
	profile, err := s.uc.GetProfile(ctx, bearerToken(ctx))
	if err != nil {
		return nil, err
	}
	return &v1.GetProfileReply{Data: convertProfileReply(profile)}, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, req *v1.UpdateProfileRequest) (*v1.GetProfileReply, error) {
	profile, err := s.uc.UpdateProfile(ctx, bearerToken(ctx), &biz.Profile{
		DisplayName: req.GetDisplayName(),
		Email:       req.GetEmail(),
		Phone:       req.GetPhone(),
	})
	if err != nil {
		return nil, err
	}
	return &v1.GetProfileReply{Data: convertProfileReply(profile)}, nil
}

func (s *ProfileService) ChangePassword(ctx context.Context, req *v1.ChangePasswordRequest) (*emptypb.Empty, error) {
	if err := s.uc.ChangePassword(ctx, bearerToken(ctx), req.GetCurrentPassword(), req.GetNewPassword(), req.GetConfirmPassword()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (s *ProfileService) UploadAvatarHTTP(ctx khttp.Context) error {
	req := ctx.Request()
	if err := req.ParseMultipartForm(biz.MaxAvatarSizeBytes + 1024); err != nil {
		return biz.ErrProfileInvalidArgument
	}
	file, header, err := req.FormFile("file")
	if err != nil {
		return biz.ErrProfileInvalidArgument
	}
	defer file.Close()

	body, err := io.ReadAll(io.LimitReader(file, biz.MaxAvatarSizeBytes+1))
	if err != nil {
		return err
	}
	if len(body) == 0 || len(body) > biz.MaxAvatarSizeBytes {
		return biz.ErrProfileInvalidArgument
	}

	contentType := detectAvatarContentType(body, header.Header.Get("Content-Type"))
	profile, avatar, err := s.uc.UploadAvatar(ctx, bearerToken(ctx), &biz.AvatarUpload{
		Filename:    header.Filename,
		ContentType: contentType,
		Size:        int64(len(body)),
		Reader:      bytes.NewReader(body),
	})
	if err != nil {
		return err
	}
	return ctx.Result(http.StatusOK, &v1.UploadAvatarReply{
		Avatar:  avatar,
		Profile: convertProfileReply(profile),
	})
}

func detectAvatarContentType(body []byte, headerContentType string) string {
	detected := http.DetectContentType(body)
	if detected == "application/octet-stream" && isWebP(body) {
		return "image/webp"
	}
	if detected == "application/octet-stream" {
		return headerContentType
	}
	return detected
}

func isWebP(body []byte) bool {
	return len(body) >= 12 &&
		string(body[0:4]) == "RIFF" &&
		string(body[8:12]) == "WEBP"
}

func convertProfileReply(profile *biz.Profile) *v1.Profile {
	if profile == nil {
		return nil
	}
	return &v1.Profile{
		Id:          profile.ID,
		Username:    profile.Username,
		DisplayName: profile.DisplayName,
		Avatar:      profile.Avatar,
		Email:       profile.Email,
		Phone:       profile.Phone,
		Status:      profile.Status,
		RoleCodes:   append([]string(nil), profile.RoleCodes...),
	}
}
