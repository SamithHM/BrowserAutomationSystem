import { useEffect, useState } from "react";

function ApplicationTable({
    onApplicationStarted,
    onApplicationProcessed
}) {

    const [applications, setApplications] = useState([]);
    const [processingId, setProcessingId] = useState(null);

   useEffect(() => {

    async function loadApplications() {

        try {

            const response = await fetch(
                "http://localhost:3000/applications"
            );

            const data = await response.json();

            setApplications(data.data);

        } catch (error) {

            console.error(
                "Error fetching applications:",
                error
            );

        }
    }

    loadApplications();

    const interval = setInterval(
        loadApplications,
        3000
    );

    return () => {
        clearInterval(interval);
    };

}, []);

    async function handleProcess(id) {

        try {

            // Remember which application was clicked
            setProcessingId(id);

            // Tell App that processing has started
            await onApplicationStarted();

            const response = await fetch(
                `http://localhost:3000/applications/${id}/process`,
                {
                    method: "POST"
                }
            );

            const data = await response.json();

            console.log(
                "Queue response:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to queue application"
                );
            }

            // alert(
            //     "Application added to processing queue"
            // );

            // Remove it from Pending Applications
            // because backend has changed its status
            

            // Refresh parent statistics
            await onApplicationProcessed();

        } catch (error) {

            console.error(
                "Error processing application:",
                error
            );

            alert(
                `Failed to queue application: ${error.message}`
            );

        } finally {

            setProcessingId(null);

        }
    }

    return (
        <div className="applications">

            <h2>
                Applications
            </h2>

            <table>

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>

                </thead>

                <tbody>

                    {applications.map((application) => (

                        <tr key={application._id}>

                            <td>
                                {application._id}
                            </td>

                            <td>
                                {application.name}
                            </td>

                            <td>
                                {application.email}
                            </td>

                            <td>
                                {application.status}
                            </td>

                            <td>

    {application.status === "pending" && (

        <button
            onClick={() =>
                handleProcess(application._id)
            }
            disabled={
                processingId === application._id
            }
        >

            {processingId === application._id
                ? "Queued..."
                : "Process"}

        </button>

    )}

    {application.status === "processing" && (

        <span>
            Processing...
        </span>

    )}

    {application.status === "completed" && (

        <span>
            Completed
        </span>

    )}

    {application.status === "failed" && (

        <span>
            Failed
        </span>

    )}

</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}

export default ApplicationTable;