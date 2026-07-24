package biz

import (
	"strings"
	"testing"
)

func TestValidateProfile(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		profile *Profile
		wantErr bool
	}{
		{
			name: "valid profile",
			profile: &Profile{
				DisplayName: "Admin",
				Email:       "admin@example.local",
				Phone:       "+86 13800138000",
			},
		},
		{
			name:    "empty display name",
			profile: &Profile{DisplayName: ""},
			wantErr: true,
		},
		{
			name: "invalid email",
			profile: &Profile{
				DisplayName: "Admin",
				Email:       "bad-email",
			},
			wantErr: true,
		},
		{
			name: "invalid phone",
			profile: &Profile{
				DisplayName: "Admin",
				Phone:       "phone#bad",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateProfile(normalizeProfile(tt.profile))
			if tt.wantErr && err == nil {
				t.Fatal("expected error")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidateAvatarUpload(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		upload  *AvatarUpload
		wantErr bool
	}{
		{
			name: "valid png",
			upload: &AvatarUpload{
				Filename:    "avatar.png",
				ContentType: "image/png",
				Size:        128,
				Reader:      strings.NewReader("avatar"),
			},
		},
		{
			name:    "missing file",
			upload:  nil,
			wantErr: true,
		},
		{
			name: "unsupported type",
			upload: &AvatarUpload{
				Filename:    "avatar.txt",
				ContentType: "text/plain",
				Size:        128,
				Reader:      strings.NewReader("avatar"),
			},
			wantErr: true,
		},
		{
			name: "oversized file",
			upload: &AvatarUpload{
				Filename:    "avatar.jpg",
				ContentType: "image/jpeg",
				Size:        MaxAvatarSizeBytes + 1,
				Reader:      strings.NewReader("avatar"),
			},
			wantErr: true,
		},
		{
			name: "mismatched extension",
			upload: &AvatarUpload{
				Filename:    "avatar.txt",
				ContentType: "image/png",
				Size:        128,
				Reader:      strings.NewReader("avatar"),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateAvatarUpload(tt.upload)
			if tt.wantErr && err == nil {
				t.Fatal("expected error")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
