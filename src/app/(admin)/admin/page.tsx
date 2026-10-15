
import Link from "next/link";
import {
  formatDate,
  formatDateTime,
  getAdminDashboardData,
} from "@/lib/dashboard";

export default async function AdminRootPage() {
  const {
    metrics,
    upcomingSessions,
    recentMatches,
    unloggedSessions,
  } = await getAdminDashboardData();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            KICKOASIS / OVERVIEW
          </p>

          <h1 className="display dashboard-title">
            DASHBOARD
          </h1>

          <p className="dashboard-intro">
            Your academy at a glance.
          </p>
        </div>

      </header>

      <section
        aria-label="Academy key performance indicators"
        className="dashboard-grid"
      >
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`dashboard-kpi dashboard-kpi--${metric.tone}`}
          >
            <span className="dashboard-kpi-label">
              {metric.label}
            </span>

            <strong className="dashboard-kpi-value">
              {metric.value}
            </strong>

            <span className="dashboard-kpi-detail">
              {metric.detail}
            </span>
          </Link>
        ))}
      </section>

      {unloggedSessions.length > 0 && (
        <section
          className="dashboard-alert"
          aria-label="Training attendance alert"
        >
          <div>
            <strong className="dashboard-alert-title">
              Action required
            </strong>

            <p className="dashboard-alert-message">
              {unloggedSessions.length === 5
                ? "At least 5 past training sessions need attendance records."
                : `${unloggedSessions.length} past training session${unloggedSessions.length === 1 ? "" : "s"} need attendance records.`}
            </p>
          </div>

          <Link
            href="/admin/training"
            className="dashboard-link"
          >
            Review training log →
          </Link>
        </section>
      )}

      <section
        className="dashboard-panels"
        aria-label="Academy activity"
      >
        <div className="dashboard-card">
          <div className="dashboard-section-heading">
            <h2>Upcoming Sessions</h2>

            <Link
              href="/admin/schedule"
              className="dashboard-link"
            >
              View all →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <p className="dashboard-muted">
              No upcoming events are scheduled.
            </p>
          ) : (
            <div className="dashboard-list">
              {upcomingSessions.map((event) => (
                <div
                  key={event.id}
                  className="dashboard-list-row"
                >
                  <div>
                    <strong>{event.title}</strong>

                    <div className="dashboard-list-meta">
                      {event.team.name} · {event.type}
                    </div>
                  </div>

                  <span className="dashboard-list-date">
                    {formatDateTime(event.startsAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-section-heading">
            <h2>Recent Matches</h2>

            <Link
              href="/admin/schedule"
              className="dashboard-link"
            >
              View all →
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <p className="dashboard-muted">
              No completed matches found.
            </p>
          ) : (
            <div className="dashboard-list">
              {recentMatches.map((event) => (
                <div
                  key={event.id}
                  className="dashboard-list-row"
                >
                  <div>
                    <strong>{event.title}</strong>

                    <div className="dashboard-list-meta">
                      {event.team.name} · {formatDate(event.startsAt)}
                    </div>
                  </div>

                  <strong className="dashboard-list-result">
                    {event.homeScore != null &&
                    event.awayScore != null
                      ? `${event.homeScore} - ${event.awayScore}`
                      : "Result pending"}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}