import { useEffect, useState } from "react";
import StatCard from "./components/StatCard";
import ApplicationTable from "./components/ApplicationTable";
import "./App.css";

function App() {

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0
    });

async function fetchStats() {

    try {

        const response = await fetch(
            "http://localhost:3000/applications/stats"
        );

        const data = await response.json();

        return data.data;

    } catch (error) {

        console.error(
            "Error fetching statistics:",
            error
        );

        return null;
    }
}


async function refreshStats() {

    const data = await fetchStats();

    if (data) {
        setStats(data);
    }

}
useEffect(() => {

    async function loadStats() {

        const data = await fetchStats();

        if (data) {
            setStats(data);
        }

    }

    // Fetch immediately when component loads
    loadStats();

    // Fetch again every 1 second
    const interval = setInterval(() => {
        loadStats();
    }, 1000);

    // Stop the interval when component is removed
    return () => {
        clearInterval(interval);
    };

}, []);

    return (
        <div className="dashboard">

            <h1>
                Application Automation Dashboard
            </h1>

            <div className="stats-container">

                <StatCard
                    title="Total"
                    value={stats.total}
                />

                <StatCard
                    title="Pending"
                    value={stats.pending}
                />

                <StatCard
                    title="Processing"
                    value={stats.processing}
                />

                <StatCard
                    title="Completed"
                    value={stats.completed}
                />

            </div>

            <ApplicationTable
                onApplicationStarted={refreshStats}
                onApplicationProcessed={refreshStats}
            />

        </div>
    );
}

export default App;