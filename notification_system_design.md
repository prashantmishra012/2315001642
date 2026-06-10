# Notification System Design

## Stage 1
### REST API Design
The core actions the notification platform should support are fetching the user's notifications and marking a notification as read.

**1. Fetch Notifications**
- **Endpoint**: `GET /api/v1/notifications`
- **Description**: Retrieves a paginated list of notifications for the currently authenticated user.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20)
  - `notification_type` (string, optional) - e.g., "Event", "Result", "Placement"
- **Response**:
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "isRead": false,
        "timestamp": "2026-04-22T17:51:18Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

**2. Mark Notification as Read**
- **Endpoint**: `PUT /api/v1/notifications/{id}/read`
- **Description**: Marks a specific notification as read.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response**:
```json
{
  "status": "success",
  "message": "Notification marked as read successfully"
}
```

### Real-Time Notifications Mechanism
For real-time delivery, **Server-Sent Events (SSE)** is the optimal choice over WebSockets because notification delivery is inherently unidirectional (Server -> Client). SSE is lighter, runs over standard HTTP, and has built-in connection retry mechanisms. When a user connects to the web app, a persistent HTTP connection to `GET /api/v1/notifications/stream` is established. New notifications are pushed to the client immediately.
