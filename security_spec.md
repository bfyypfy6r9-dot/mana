# Security Specification for "Maná" Database Rules

This document details the data invariants, threat model ("Dirty Dozen" payloads), and Firestore security rules validation plan for the Maná applet.

## 1. Data Invariants
1. **User Invariant**: A user document (`/users/{uid}`) must only be created by its authenticated owner and with `isApproved` set to `false`, unless created as the predefined admin `pedrorafaela_araujo@hotmail.com` or updated by the verified admin.
2. **ChurchData Invariant**: Church data must correspond to the user's registered church, unless updated or filtered by the admin. The monthYear must be structurally valid. All numeric values must be non-negative.
3. **FeedPost Invariant**: Feed posts can be created by any approved, authenticated user. The creator UID must match the current authenticated user's UID. The church name must match the user's church name.

## 2. The "Dirty Dozen" Threat Payloads (Targeting Exploits)
We assert that the following malicious operations must be blocked (`PERMISSION_DENIED`):

1. **Self-Approval Attack**: User "anon_user_1" attempts to write a user document to `/users/anon_user_1` with `isApproved: true`.
2. **Identity Spoofing**: User "hacker_1" attempts to register using someone else's email in Auth but writes displayName "Admin" and `isApproved: true` under `/users/hacker_1`.
3. **Admin Email Hijack**: An unverified account registering under `pedrorafaela_araujo@hotmail.com` attempting to instantly gain admin permissions without passing through email verification checks.
4. **Foreign Church Corruption**: User "user_guajiru" (from Guajiru church) attempts to create or average data under `/churchData/Vale_Dourado_1_2026-06` for the Vale Dourado 1 church.
5. **Junk ID Poisoning**: A user attempts to create a document with an ID longer than 128 characters or containing illegal characters (like `/churchData/church%20name$$$`).
6. **Negative Value Poisoning**: User attempts to submit a negative number for targets or achieved figures, e.g., `childrenMeta: -5`.
7. **Unauthorized Feed Posting**: An unapproved user (`isApproved: false`) attempts to post an incentive in the Feed.
8. **Impersonated Feed Posting**: User "userA" submits a Feed post under document `/feed/post_1` with `userId: "userB"` to represent or frame another user.
9. **Historical Record Locking Bypass**: Attempting to alter historic `createdAt` fields on a user profile or a feed post after creation.
10. **Admin Bypass by Impostor**: An unapproved or non-admin user attempts to query all users or approve another member under `/users/{uid}`.
11. **Denial of Wallet Query Scraping**: Running queries on `churchData` or `users` without filtering, causing massive listing costs or leaking privacy profiles.
12. **Ghost Field Injection**: Submitting an update to a post or church record with unexpected properties like `secretAdminCode: "1234"` to exploit schema weaknesses.

## 3. Test Cases (firestore.rules.test.ts Conceptual Layout)
A conceptual TypeScript test using `@firebase/rules-unit-testing` would enforce:
* User profiles must start with `isApproved = false`.
* Admins are recognized using explicit checks or fixed authentication state mapping.
* Normal users are blocked from calling queries that fetch records belonging to users of other churches or modifying other churches' statistics.
