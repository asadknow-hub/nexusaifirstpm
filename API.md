# Nexus PM API Documentation

This document provides an overview of the API endpoints available in the Nexus PM application.

## Authentication

All API endpoints require authentication using Supabase Auth. Include the session token in the `Authorization` header:

```
Authorization: Bearer <your-session-token>
```

## Base URL

```
https://your-app.vercel.app/api
```

## Workspaces

### Get All Workspaces
```
GET /api/workspaces
```

### Get Workspace by Slug
```
GET /api/workspaces/[slug]
```

### Create Workspace
```
POST /api/workspaces
Content-Type: application/json

{
  "name": "My Workspace",
  "slug": "my-workspace"
}
```

### Update Workspace
```
PUT /api/workspaces/[id]
Content-Type: application/json

{
  "name": "Updated Workspace",
  "logo_url": "https://example.com/logo.png"
}
```

### Delete Workspace
```
DELETE /api/workspaces/[id]
```

## Projects

### Get All Projects
```
GET /api/projects?workspace_id=[workspaceId]
```

### Get Project by ID
```
GET /api/projects/[id]
```

### Create Project
```
POST /api/projects
Content-Type: application/json

{
  "workspace_id": "workspace-uuid",
  "name": "My Project",
  "identifier": "PROJ",
  "description": "Project description",
  "emoji": "📋"
}
```

### Update Project
```
PUT /api/projects/[id]
Content-Type: application/json

{
  "name": "Updated Project",
  "description": "Updated description"
}
```

### Delete Project
```
DELETE /api/projects/[id]
```

## Issues

### Get All Issues
```
GET /api/issues?project_id=[projectId]
```

### Get Issue by ID
```
GET /api/issues/[id]
```

### Create Issue
```
POST /api/issues
Content-Type: application/json

{
  "project_id": "project-uuid",
  "name": "Issue title",
  "description": "Issue description",
  "priority": "high",
  "state_id": "state-uuid"
}
```

### Update Issue
```
PUT /api/issues/[id]
Content-Type: application/json

{
  "name": "Updated title",
  "priority": "urgent",
  "state_id": "new-state-uuid"
}
```

### Delete Issue
```
DELETE /api/issues/[id]
```

## Issue Comments

### Get Comments for Issue
```
GET /api/issues/[issueId]/comments
```

### Create Comment
```
POST /api/issues/[issueId]/comments
Content-Type: application/json

{
  "comment_stripped": "Comment text",
  "comment_html": "<p>Comment text</p>",
  "comment_json": {}
}
```

### Update Comment
```
PUT /api/comments/[id]
Content-Type: application/json

{
  "comment_stripped": "Updated comment"
}
```

### Delete Comment
```
DELETE /api/comments/[id]
```

## Issue Attachments

### Get Attachments for Issue
```
GET /api/issues/[issueId]/attachments
```

### Create Attachment
```
POST /api/issues/[issueId]/attachments
Content-Type: multipart/form-data

{
  "file": <file>,
  "attributes": {}
}
```

### Delete Attachment
```
DELETE /api/attachments/[id]
```

## Issue Activities

### Get Activities for Issue
```
GET /api/issues/[issueId]/activities
```

## Cycles

### Get All Cycles
```
GET /api/cycles?project_id=[projectId]
```

### Get Cycle by ID
```
GET /api/cycles/[id]
```

### Create Cycle
```
POST /api/cycles
Content-Type: application/json

{
  "project_id": "project-uuid",
  "name": "Sprint 1",
  "description": "First sprint",
  "start_date": "2024-01-01",
  "end_date": "2024-01-14"
}
```

### Update Cycle
```
PUT /api/cycles/[id]
Content-Type: application/json

{
  "name": "Updated Sprint",
  "end_date": "2024-01-21"
}
```

### Delete Cycle
```
DELETE /api/cycles/[id]
```

## Modules

### Get All Modules
```
GET /api/modules?project_id=[projectId]
```

### Get Module by ID
```
GET /api/modules/[id]
```

### Create Module
```
POST /api/modules
Content-Type: application/json

{
  "project_id": "project-uuid",
  "name": "Module 1",
  "description": "Module description",
  "start_date": "2024-01-01",
  "target_date": "2024-01-31"
}
```

### Update Module
```
PUT /api/modules/[id]
Content-Type: application/json

{
  "name": "Updated Module"
}
```

### Delete Module
```
DELETE /api/modules/[id]
```

## Pages

### Get All Pages
```
GET /api/pages?project_id=[projectId]
```

### Get Page by ID
```
GET /api/pages/[id]
```

### Create Page
```
POST /api/pages
Content-Type: application/json

{
  "project_id": "project-uuid",
  "name": "Page Title",
  "description": "Page content",
  "description_html": "<p>Page content</p>",
  "description_json": {}
}
```

### Update Page
```
PUT /api/pages/[id]
Content-Type: application/json

{
  "name": "Updated Title",
  "description": "Updated content"
}
```

### Delete Page
```
DELETE /api/pages/[id]
```

## Webhooks

### Get All Webhooks
```
GET /api/webhooks?workspace_id=[workspaceId]
```

### Get Webhook by ID
```
GET /api/webhooks/[id]
```

### Create Webhook
```
POST /api/webhooks
Content-Type: application/json

{
  "workspace_id": "workspace-uuid",
  "project_id": "project-uuid",
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "events": ["issue.created", "issue.updated"],
  "secret": "webhook-secret"
}
```

### Update Webhook
```
PUT /api/webhooks/[id]
Content-Type: application/json

{
  "is_active": false,
  "events": ["issue.created"]
}
```

### Delete Webhook
```
DELETE /api/webhooks/[id]
```

### Get Webhook Logs
```
GET /api/webhooks/[id]/logs
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse. The default limit is 100 requests per minute per user.

## Pagination

List endpoints support pagination using query parameters:

```
GET /api/issues?project_id=[projectId]&page=1&limit=20
```

## Filtering

List endpoints support filtering using query parameters:

```
GET /api/issues?project_id=[projectId]&priority=high&state_id=[stateId]
```

## Sorting

List endpoints support sorting using query parameters:

```
GET /api/issues?project_id=[projectId]&sort=created_at&order=desc
```
