# Current User Extension Contract

## Endpoint

```text
GET /api/currentUser
```

## Required Payload Shape

The response MUST include:

- User id.
- Username.
- Display name.
- Avatar when available.
- Account status.
- Role code list.
- Menu permission code list.
- Button permission code list.

## Permission Semantics

- Role codes come from active enabled roles bound to the user.
- Menu permission codes come from active enabled directory/page nodes granted by
  those roles.
- Button permission codes come from active enabled button nodes granted by those
  roles.
- Disabled users must not receive a successful current-user response.
- Disabled roles and disabled permission nodes must not grant active access.

## Frontend Consumption

- Route and menu visibility use menu permission codes.
- Page action buttons use button permission codes through the agreed frontend
  access helper or access map.
