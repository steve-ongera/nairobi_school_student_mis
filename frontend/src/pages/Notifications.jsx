import { getMyNotifications } from "../utils/api";
import { useFetch } from "../hooks";
import { formatDateTime } from "../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, EmptyState } from "../components/common";

const TYPE_ICONS = {
  sms: "bi-chat-dots",
  email: "bi-envelope",
  system: "bi-bell",
  fee: "bi-cash-coin",
  result: "bi-journal-check",
  attendance: "bi-calendar-check",
};

const TYPE_COLORS = {
  sms: "success",
  email: "primary",
  system: "info",
  fee: "warning",
  result: "primary",
  attendance: "secondary",
};

export default function Notifications() {
  const { data: notifications, loading, error } = useFetch(() => getMyNotifications());

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle title="Notifications" breadcrumbs={[{ label: "Notifications" }]} />
      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">
            My Notifications
            {notifications?.length > 0 && (
              <span className="badge bg-primary ms-2">{notifications.length}</span>
            )}
          </h5>

          {!notifications?.length ? (
            <EmptyState message="No notifications yet." icon="bi-bell-slash" />
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="list-group-item d-flex align-items-start gap-3 py-3"
                  style={{ borderColor: "#ebeef4" }}
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                    style={{
                      width: 40, height: 40,
                      background: `var(--bs-${TYPE_COLORS[n.notification_type] || "secondary"}-bg, #f6f9ff)`,
                      color: `var(--bs-${TYPE_COLORS[n.notification_type] || "secondary"})`,
                    }}
                  >
                    <i className={`bi ${TYPE_ICONS[n.notification_type] || "bi-bell"}`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className={`badge bg-${TYPE_COLORS[n.notification_type] || "secondary"} me-2`}>
                          {n.notification_type}
                        </span>
                        <span className={`badge bg-${n.is_sent ? "success" : "warning"}`}>
                          {n.is_sent ? "Sent" : "Pending"}
                        </span>
                      </div>
                      <small className="text-muted">{formatDateTime(n.created_at)}</small>
                    </div>
                    <p className="mb-0 mt-1" style={{ fontSize: 14 }}>{n.message || n.event}</p>
                    {n.error_message && (
                      <small className="text-danger">
                        <i className="bi bi-exclamation-circle me-1" />{n.error_message}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}