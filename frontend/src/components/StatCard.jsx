function StatCard({ title, value }) {
    return (
        <div className="stat-card">
            <h3>{title}</h3>

            <p>{value}</p>
        </div>
    );
}

export default StatCard;