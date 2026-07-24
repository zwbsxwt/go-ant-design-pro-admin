package data

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime"
	"path"
	"strings"

	"template-v6/server/admin-service/internal/biz"
	"template-v6/server/admin-service/internal/conf"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type s3PutObjectAPI interface {
	PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

type avatarStorage struct {
	client        s3PutObjectAPI
	endpoint      string
	bucket        string
	publicBaseURL string
	configured    bool
}

func newAvatarStorage(c *conf.Data_ObjectStorage) *avatarStorage {
	if c == nil {
		return &avatarStorage{}
	}
	endpoint := strings.TrimRight(strings.TrimSpace(c.GetEndpoint()), "/")
	accessKey := strings.TrimSpace(c.GetAccessKey())
	secretKey := strings.TrimSpace(c.GetSecretKey())
	bucket := strings.Trim(strings.TrimSpace(c.GetBucket()), "/")
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return &avatarStorage{
			endpoint:      endpoint,
			bucket:        bucket,
			publicBaseURL: strings.TrimRight(strings.TrimSpace(c.GetPublicBaseUrl()), "/"),
		}
	}
	region := strings.TrimSpace(c.GetRegion())
	if region == "" {
		region = "us-east-1"
	}
	client := s3.New(s3.Options{
		Region:       region,
		Credentials:  aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		BaseEndpoint: aws.String(endpoint),
		UsePathStyle: c.GetForcePathStyle(),
	})
	return &avatarStorage{
		client:        client,
		endpoint:      endpoint,
		bucket:        bucket,
		publicBaseURL: strings.TrimRight(strings.TrimSpace(c.GetPublicBaseUrl()), "/"),
		configured:    true,
	}
}

func (s *avatarStorage) Upload(ctx context.Context, userID string, upload *biz.AvatarUpload) (string, error) {
	if s == nil || !s.configured || s.client == nil {
		return "", biz.ErrProfileStorageUnavailable
	}
	body, err := io.ReadAll(upload.Reader)
	if err != nil {
		return "", fmt.Errorf("read avatar upload: %w", err)
	}
	if int64(len(body)) != upload.Size {
		return "", biz.ErrProfileInvalidArgument
	}
	objectKey, err := avatarObjectKey(userID, upload.ContentType)
	if err != nil {
		return "", err
	}
	if _, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(body),
		ContentType: aws.String(upload.ContentType),
	}); err != nil {
		return "", fmt.Errorf("%w: %v", biz.ErrProfileStorageUnavailable, err)
	}
	return s.objectURL(objectKey), nil
}

func avatarObjectKey(userID string, contentType string) (string, error) {
	exts, err := mime.ExtensionsByType(strings.ToLower(strings.TrimSpace(contentType)))
	if err != nil || len(exts) == 0 {
		return "", biz.ErrProfileInvalidArgument
	}
	ext := exts[0]
	if ext == ".jpe" {
		ext = ".jpg"
	}
	return path.Join("avatars", sanitizeObjectPathPart(userID), uuid.NewString()+ext), nil
}

func sanitizeObjectPathPart(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "unknown"
	}
	replacer := strings.NewReplacer("/", "-", "\\", "-", "..", "-", " ", "-")
	return replacer.Replace(value)
}

func (s *avatarStorage) objectURL(objectKey string) string {
	if s.publicBaseURL != "" {
		return s.publicBaseURL + "/" + objectKey
	}
	return strings.TrimRight(s.endpoint, "/") + "/" + s.bucket + "/" + objectKey
}
