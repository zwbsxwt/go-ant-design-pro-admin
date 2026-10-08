package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/go-kratos/kratos/v3/errors"
	khttp "github.com/go-kratos/kratos/v3/transport/http"
	"template-v6/server/admin-service/internal/biz"
)

var errHarnessInvalidArgument = errors.BadRequest("HARNESS_INVALID_ARGUMENT", "invalid harness request")

type HarnessService struct {
	auth     *biz.AuthUsecase
	endpoint string
	client   *http.Client
}

type sseFlushWriter struct {
	writer http.ResponseWriter
}

func (w sseFlushWriter) Write(data []byte) (int, error) {
	written, err := w.writer.Write(data)
	if err != nil {
		return written, err
	}
	if err := http.NewResponseController(w.writer).Flush(); err != nil {
		return written, err
	}
	return written, nil
}

func NewHarnessService(auth *biz.AuthUsecase) *HarnessService {
	endpoint := strings.TrimRight(os.Getenv("AGENT_SDK_ENDPOINT"), "/")
	if endpoint == "" {
		endpoint = "http://127.0.0.1:19100"
	}
	return &HarnessService{auth: auth, endpoint: endpoint, client: &http.Client{Transport: &http.Transport{ResponseHeaderTimeout: 10 * time.Second}}}
}

func (s *HarnessService) call(ctx context.Context, method, path, owner string, query url.Values, body []byte) (*http.Response, error) {
	values := url.Values{"owner_id": []string{owner}}
	for key, items := range query {
		for _, item := range items {
			values.Add(key, item)
		}
	}
	req, err := http.NewRequestWithContext(ctx, method, s.endpoint+path+"?"+values.Encode(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	return s.client.Do(req)
}

func (s *HarnessService) user(ctx context.Context) (*biz.AuthUser, error) {
	return s.auth.CurrentUser(ctx, bearerToken(ctx))
}

func (s *HarnessService) proxyJSON(ctx khttp.Context, method, path, permission string, body []byte) error {
	return s.proxyJSONWithQuery(ctx, method, path, permission, ctx.Query(), body)
}

func (s *HarnessService) proxyJSONWithQuery(ctx khttp.Context, method, path, permission string, query url.Values, body []byte) error {
	user, err := s.user(ctx)
	if err != nil {
		return err
	}
	if user.Role != "admin" && !containsPermission(user, permission) {
		return biz.ErrSystemUnauthorized
	}
	resp, err := s.call(ctx, method, path, user.ID, query, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		return fmt.Errorf("agent runtime returned %d: %s", resp.StatusCode, strings.TrimSpace(string(data)))
	}
	return ctx.Blob(resp.StatusCode, "application/json; charset=utf-8", data)
}

func sessionListQuery(input url.Values) url.Values {
	query := url.Values{}
	for key, values := range input {
		query[key] = append([]string(nil), values...)
	}
	query.Set("kind", "general")
	return query
}

func harnessPermission(ctx khttp.Context, general string) string {
	return general
}

func containsPermission(user *biz.AuthUser, permission string) bool {
	for _, item := range append(user.MenuPermissions, user.ButtonPermissions...) {
		if item == permission {
			return true
		}
	}
	return false
}

func (s *HarnessService) ListSessions(ctx khttp.Context) error {
	return s.proxyJSONWithQuery(ctx, http.MethodGet, "/sessions", harnessPermission(ctx, "menu.harness"), sessionListQuery(ctx.Query()), nil)
}

func (s *HarnessService) CreateSession(ctx khttp.Context) error {
	var body struct {
		Kind string `json:"kind"`
	}
	body.Kind = "general"
	if err := ctx.Bind(&body); err != nil {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(body)
	return s.proxyJSON(ctx, http.MethodPost, "/sessions", "button.harness.session.create", encoded)
}

func (s *HarnessService) GetSession(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodGet, "/sessions/"+ctx.Vars().Get("sessionId"), harnessPermission(ctx, "menu.harness"), nil)
}

func normalizeSessionTitle(title string) (string, bool) {
	normalized := strings.TrimSpace(title)
	return normalized, normalized != "" && utf8.RuneCountInString(normalized) <= 80
}

func validReasoningEffort(value string) bool {
	switch value {
	case "", "off", "low", "high", "max":
		return true
	default:
		return false
	}
}

func (s *HarnessService) RenameSession(ctx khttp.Context) error {
	var body struct {
		Title string `json:"title"`
	}
	if err := ctx.Bind(&body); err != nil {
		return errHarnessInvalidArgument
	}
	title, valid := normalizeSessionTitle(body.Title)
	if !valid {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(map[string]string{"title": title})
	return s.proxyJSON(ctx, http.MethodPatch, "/sessions/"+ctx.Vars().Get("sessionId")+"/title", harnessPermission(ctx, "button.harness.session.create"), encoded)
}

func (s *HarnessService) SendMessage(ctx khttp.Context) error {
	var body struct {
		Content          string `json:"content"`
		Mode             string `json:"mode"`
		Model            string `json:"model"`
		ReasoningEffort  string `json:"reasoningEffort"`
		KnowledgeContext struct {
			FolderID string `json:"folderId"`
			Targets  []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"targets"`
		} `json:"knowledgeContext"`
	}
	if err := ctx.Bind(&body); err != nil || strings.TrimSpace(body.Content) == "" {
		return errHarnessInvalidArgument
	}
	if !validReasoningEffort(body.ReasoningEffort) {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(body)
	return s.proxyJSON(ctx, http.MethodPost, "/sessions/"+ctx.Vars().Get("sessionId")+"/messages", harnessPermission(ctx, "button.harness.message.send"), encoded)
}

func (s *HarnessService) Cancel(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodPost, "/sessions/"+ctx.Vars().Get("sessionId")+"/cancel", harnessPermission(ctx, "button.harness.message.cancel"), nil)
}

func (s *HarnessService) DeleteSession(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodDelete, "/sessions/"+ctx.Vars().Get("sessionId"), harnessPermission(ctx, "button.harness.session.delete"), nil)
}

func (s *HarnessService) Events(ctx khttp.Context) error {
	user, err := s.user(ctx)
	if err != nil {
		return err
	}
	if user.Role != "admin" && !containsPermission(user, harnessPermission(ctx, "menu.harness")) {
		return biz.ErrSystemUnauthorized
	}
	query := url.Values{}
	if afterSeq := strings.TrimSpace(ctx.Query().Get("afterSeq")); afterSeq != "" {
		query.Set("after_seq", afterSeq)
	}
	resp, err := s.call(ctx, http.MethodGet, "/sessions/"+ctx.Vars().Get("sessionId")+"/events", user.ID, query, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("agent runtime returned %d", resp.StatusCode)
	}
	ctx.Response().Header().Set("Cache-Control", "no-cache, no-transform")
	ctx.Response().Header().Set("Connection", "keep-alive")
	ctx.Response().Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	ctx.Response().Header().Set("Content-Encoding", "identity")
	ctx.Response().Header().Set("X-Accel-Buffering", "no")
	ctx.Response().WriteHeader(http.StatusOK)
	writer := sseFlushWriter{writer: ctx.Response()}
	// Some browser-facing development proxies hold very small response chunks.
	// A valid SSE comment opens the stream immediately without becoming an event.
	if _, err := writer.Write([]byte(":" + strings.Repeat(" ", 2048) + "\n\n")); err != nil {
		return err
	}
	_, err = io.Copy(writer, resp.Body)
	return err
}

func (s *HarnessService) Capabilities(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodGet, "/capabilities", harnessPermission(ctx, "menu.harness"), nil)
}

func (s *HarnessService) ListWorkspaces(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodGet, "/workspaces", "menu.harness", nil)
}

func (s *HarnessService) CreateWorkspace(ctx khttp.Context) error {
	var body map[string]string
	if err := ctx.Bind(&body); err != nil || strings.TrimSpace(body["name"]) == "" {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(body)
	return s.proxyJSON(ctx, http.MethodPost, "/workspaces", "button.harness.session.create", encoded)
}

func (s *HarnessService) DeleteWorkspace(ctx khttp.Context) error {
	return s.proxyJSON(ctx, http.MethodDelete, "/workspaces/"+ctx.Vars().Get("workspaceId"), "button.harness.session.delete", nil)
}

func (s *HarnessService) AssignWorkspace(ctx khttp.Context) error {
	var body map[string]any
	if err := ctx.Bind(&body); err != nil {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(body)
	return s.proxyJSON(ctx, http.MethodPatch, "/sessions/"+ctx.Vars().Get("sessionId")+"/workspace", "menu.harness", encoded)
}

func (s *HarnessService) Preferences(ctx khttp.Context) error {
	var body map[string]string
	if err := ctx.Bind(&body); err != nil {
		return errHarnessInvalidArgument
	}
	if !validReasoningEffort(body["reasoningEffort"]) {
		return errHarnessInvalidArgument
	}
	encoded, _ := json.Marshal(body)
	return s.proxyJSON(ctx, http.MethodPatch, "/sessions/"+ctx.Vars().Get("sessionId")+"/preferences", harnessPermission(ctx, "button.harness.message.send"), encoded)
}

