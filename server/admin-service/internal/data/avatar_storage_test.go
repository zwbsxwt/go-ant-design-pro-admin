package data

import (
	"context"
	"io"
	"strings"
	"testing"

	"template-v6/server/admin-service/internal/biz"
	"template-v6/server/admin-service/internal/conf"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type fakeS3Client struct {
	bucket      string
	key         string
	contentType string
	body        string
}

func (f *fakeS3Client) PutObject(_ context.Context, input *s3.PutObjectInput, _ ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	f.bucket = *input.Bucket
	f.key = *input.Key
	f.contentType = *input.ContentType
	body, err := io.ReadAll(input.Body)
	if err != nil {
		return nil, err
	}
	f.body = string(body)
	return &s3.PutObjectOutput{}, nil
}

func TestAvatarStorageUpload(t *testing.T) {
	t.Parallel()

	fake := &fakeS3Client{}
	storage := &avatarStorage{
		client:        fake,
		endpoint:      "http://storage.local:9000",
		bucket:        "go-ant-design-pro-admin",
		publicBaseURL: "http://storage.local:9000/go-ant-design-pro-admin",
		configured:    true,
	}

	url, err := storage.Upload(context.Background(), "user/admin", &biz.AvatarUpload{
		ContentType: "image/png",
		Size:        7,
		Reader:      strings.NewReader("content"),
	})
	if err != nil {
		t.Fatal(err)
	}
	if fake.bucket != "go-ant-design-pro-admin" {
		t.Fatalf("unexpected bucket %q", fake.bucket)
	}
	if !strings.HasPrefix(fake.key, "avatars/user-admin/") || !strings.HasSuffix(fake.key, ".png") {
		t.Fatalf("unexpected key %q", fake.key)
	}
	if fake.contentType != "image/png" {
		t.Fatalf("unexpected content type %q", fake.contentType)
	}
	if fake.body != "content" {
		t.Fatalf("unexpected body %q", fake.body)
	}
	if !strings.HasPrefix(url, "http://storage.local:9000/go-ant-design-pro-admin/avatars/user-admin/") {
		t.Fatalf("unexpected url %q", url)
	}
}

func TestAvatarStorageRequiresConfiguration(t *testing.T) {
	t.Parallel()

	storage := newAvatarStorage(&conf.Data_ObjectStorage{
		Endpoint: "http://storage.local:9000",
		Bucket:   "go-ant-design-pro-admin",
	})

	_, err := storage.Upload(context.Background(), "user-admin", &biz.AvatarUpload{
		ContentType: "image/png",
		Size:        7,
		Reader:      strings.NewReader("content"),
	})
	if err == nil {
		t.Fatal("expected configuration error")
	}
}
