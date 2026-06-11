# Security Specification - INSPIRA

## Data Invariants
1. A user can only read their own profile, unless they are an Admin.
2. Metadata for audiobooks is public for viewing (list/get), but only Admins can create/update/delete.
3. Naya Memory is strictly private to the owner (user_id matching auth.uid).
4. System fields like 'role' or 'plan' cannot be modified by the user themselves.

## The Dirty Dozen Payloads

### Users Collection
1. **Identity Spoofing**: non-admin trying to set my own role to 'Admin'. (DENIED)
2. **Identity Spoofing**: user A trying to edit user B's profile. (DENIED)
3. **Identity Spoofing**: user A trying to read user B's full profile. (DENIED)
4. **State Shortcutting**: user A trying to change their own plan to 'Premium' without a valid transaction (managed by admin/system). (DENIED)
5. **PII Blanket Test**: Listing all users as a regular user. (DENIED)

### Audiobooks Collection
6. **Integrity Violation**: non-admin trying to create an audiobook. (DENIED)
7. **Integrity Violation**: non-admin trying to update an audiobook cover or title. (DENIED)
8. **Resource Poisoning**: injecting a 1.5MB junk string as an audiobookId. (DENIED - isValidId)

### Naya Memory
9. **Identity Spoofing**: user A trying to read user B's AI memory. (DENIED)
10. **Identity Spoofing**: user A trying to write a memory record with user_id = 'userB'. (DENIED)
11. **Shadow Update**: adding a 'system_override' field to a memory record. (DENIED - hasOnly)

### Global
12. **Unauthenticated Access**: any read/write without being signed in. (DENIED)
