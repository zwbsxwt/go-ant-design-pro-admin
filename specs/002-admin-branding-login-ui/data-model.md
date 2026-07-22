# Data Model: Admin Branding And Login UI

This feature does not introduce persistent entities.

## Configuration Values

### Product Branding

- **Product Name**: `go-ant-design-pro-admin`
- **Applies To**: Browser title, manifest name, login page identity, global
  footer, starter page copy.
- **Validation Rules**: User-facing product labels must exactly match the
  canonical product name.

## Relationships

- Product branding is consumed by frontend settings and static UI text.
- Framework references remain in documentation and package metadata where they
  describe upstream Ant Design Pro.
