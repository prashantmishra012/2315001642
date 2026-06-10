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

---

## Stage 2
### Persistent Storage Choice
I suggest a Relational Database like **PostgreSQL**. The schema for notifications is highly structured and predictable. PostgreSQL provides strong ACID guarantees, and with modern indexing, JSONB support (for flexible message payloads), and partitioning, it handles notification loads exceptionally well.

### Database Schema
```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id BIGINT NOT NULL,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Potential Scaling Problems & Solutions
- **Problem**: As volume increases (e.g., millions of rows), read operations (fetching unread counts) and write operations (inserting mass notifications) will contend for resources. Indexes become large, slowing down inserts.
- **Solution**: 
  1. **Table Partitioning**: Partition the `notifications` table by date (e.g., monthly). Older notifications are rarely queried.
  2. **Caching Layer**: Use Redis to cache the "unread count" for each student.
  3. **Read Replicas**: Route all `GET` API requests to read replicas to offload the primary database.

### Queries for Stage 1 APIs
**Fetch Notifications**:
```sql
SELECT id, type, message, is_read, created_at 
FROM notifications 
WHERE student_id = ? 
ORDER BY created_at DESC 
LIMIT ? OFFSET ?;
```
**Mark as Read**:
```sql
UPDATE notifications 
SET is_read = true 
WHERE id = ? AND student_id = ?;
```
