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

---

## Stage 3
**Query Analysis**
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;
```
- **Accuracy**: Yes, the query accurately fetches the unread notifications for a specific student and sorts them chronologically.
- **Why is it slow?**: Without a composite index, the database is forced to perform a sequential scan or a sub-optimal index scan, scanning many irrelevant rows to find `isRead = false` for that specific `studentID`, and then performs an expensive sort operation on `createdAt`.
- **What to change**: Add a composite index on the exact fields queried and sorted: `CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt ASC);`.
- **Computation Cost**: With the index, it goes from O(N) full table scan down to O(log N) for the B-Tree traversal, drastically reducing I/O.
- **Index Every Column?**: No, this is terrible advice. Every index slows down `INSERT`, `UPDATE`, and `DELETE` operations because the database must update the indexes too. It also consumes massive amounts of disk space and memory (buffer cache).

**Placement Notification Query (Last 7 Days)**
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL '7 days';
```

---

## Stage 4
### Strategy to Reduce Database Overwhelm
Fetching notifications strictly on page load means the database is hammered with reads even when no new notifications exist. 

**Solutions & Tradeoffs**:
1. **Caching (Redis)**
   - *Approach*: Cache the user's latest notifications and unread count in Redis. Fetch from the DB only on cache miss.
   - *Tradeoff*: Increases infrastructure complexity and requires careful cache invalidation when a new notification arrives or is marked as read.
2. **Push over Pull (SSE/WebSockets)**
   - *Approach*: Send notifications directly to the client when they occur. The client caches them locally (e.g., Redux, LocalStorage) and doesn't need to ask the server on page load.
   - *Tradeoff*: Requires maintaining persistent connections for thousands of active users, increasing server memory overhead.
3. **Optimistic UI & Lazy Loading**
   - *Approach*: Only fetch notifications when the user actually clicks the notification bell, rather than strictly on page load.
   - *Tradeoff*: Notifications count isn't immediately visible, potentially degrading user experience for high-priority alerts.

**Suggested Implementation**: Combine Redis for caching the unread count (loaded on page load) and SSE to push real-time updates. The heavy payload (the list of notifications) is only fetched when the user opens the notification panel.

---

## Stage 5
### Shortcomings of the `notify_all` Implementation
1. **Synchronous Execution**: The loop blocks the thread. Sending 50,000 emails synchronously via a third-party API will take minutes to hours.
2. **Lack of Fault Tolerance**: When the email API failed for the 200 students, the loop likely crashed. We have no mechanism to retry those 200 without accidentally re-notifying the others.
3. **Tight Coupling**: Saving to the database and sending an email happen in the same tight loop. A failure in one affects the other. 

The DB save and Email send should **not** happen simultaneously in the same function. Database inserts are fast, while external network calls (email) are slow and unreliable. They should be decoupled using an Event-Driven architecture (Message Queues).

### Revised Pseudocode (Message Queue Architecture)
```python
# API Endpoint Handler
function notify_all(student_ids: array, message: string):
    # 1. Bulk insert to DB immediately (Fast)
    save_to_db_bulk(student_ids, message)
    
    # 2. Push to Message Queue (e.g., RabbitMQ/Kafka) (Fast)
    for student_id in student_ids:
        enqueue_message("email_queue", {student_id, message})
        enqueue_message("push_queue", {student_id, message})

# Worker 1 (Consumer for Emails - runs independently)
function process_email_queue():
    while job = dequeue("email_queue"):
        try:
            send_email(job.student_id, job.message)
            ack_job(job)
        except EmailAPIError:
            retry_job_later(job) # Exponential backoff

# Worker 2 (Consumer for Push Notifications - runs independently)
function process_push_queue():
    while job = dequeue("push_queue"):
        push_to_app(job.student_id, job.message)
        ack_job(job)
```
