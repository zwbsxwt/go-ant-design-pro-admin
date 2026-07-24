package localenv

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// LoadFiles loads simple KEY=VALUE local environment files if they exist.
func LoadFiles(paths ...string) {
	for _, path := range paths {
		loadFile(path)
	}
}

func loadFile(path string) {
	file, err := os.Open(filepath.Clean(path))
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		_ = os.Setenv(key, trimValue(value))
	}
}

func trimValue(value string) string {
	value = strings.TrimSpace(value)
	if len(value) >= 2 {
		if value[0] == '"' && value[len(value)-1] == '"' {
			return strings.Trim(value, `"`)
		}
		if value[0] == '\'' && value[len(value)-1] == '\'' {
			return strings.Trim(value, `'`)
		}
	}
	return value
}
