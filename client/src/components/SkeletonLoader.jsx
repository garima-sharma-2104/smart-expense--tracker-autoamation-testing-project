function SkeletonLoader({ type = "card", count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case "stat-cards":
        return (
          <div className="stat-cards">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card skeleton-card">
                <div className="skeleton skeleton-circle"></div>
                <div className="skeleton-lines">
                  <div className="skeleton skeleton-text-sm"></div>
                  <div className="skeleton skeleton-text-lg"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case "balance":
        return (
          <div className="balance-hero balance-positive skeleton-card">
            <div className="balance-hero-left">
              <div className="skeleton skeleton-text-sm" style={{ width: "80px" }}></div>
              <div className="skeleton skeleton-text-xl" style={{ width: "200px" }}></div>
              <div className="skeleton skeleton-text" style={{ width: "250px", marginTop: "8px" }}></div>
            </div>
            <div className="balance-hero-right">
              <div className="skeleton skeleton-block" style={{ width: "140px", height: "50px" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "140px", height: "50px" }}></div>
            </div>
          </div>
        );

      case "chart":
        return (
          <div className="dashboard-grid">
            <div className="dashboard-card skeleton-card">
              <div className="skeleton skeleton-text" style={{ width: "180px", marginBottom: "20px" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "260px" }}></div>
            </div>
            <div className="dashboard-card skeleton-card">
              <div className="skeleton skeleton-text" style={{ width: "180px", marginBottom: "20px" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "260px" }}></div>
            </div>
          </div>
        );

      case "expense-list":
        return (
          <div className="expenses-list">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="expense-card skeleton-card">
                <div className="expense-info">
                  <div className="skeleton skeleton-badge"></div>
                  <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
                  <div className="skeleton skeleton-text-sm" style={{ width: "40%", marginTop: "8px" }}></div>
                </div>
                <div className="expense-actions">
                  <div className="skeleton skeleton-text-lg" style={{ width: "80px" }}></div>
                  <div className="skeleton skeleton-block" style={{ width: "120px", height: "32px" }}></div>
                </div>
              </div>
            ))}
          </div>
        );

      case "table":
        return (
          <div className="dashboard-card skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: "160px", marginBottom: "20px" }}></div>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-table-row">
                <div className="skeleton skeleton-text" style={{ width: "30%" }}></div>
                <div className="skeleton skeleton-badge"></div>
                <div className="skeleton skeleton-text-sm" style={{ width: "15%" }}></div>
                <div className="skeleton skeleton-text-sm" style={{ width: "15%" }}></div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="skeleton-card" style={{ padding: "24px" }}>
            {[...Array(count)].map((_, i) => (
              <div key={i}>
                <div className="skeleton skeleton-text" style={{ width: `${80 - i * 15}%` }}></div>
              </div>
            ))}
          </div>
        );
    }
  };

  return <div className="skeleton-wrapper">{renderSkeleton()}</div>;
}

export default SkeletonLoader;
