import { Worker } from "bullmq";
import { processApplication } from "./automationService.js";
import { connectDB } from "./db.js";

const connection = {
    host: "127.0.0.1",
    port: 6379
};

await connectDB();

const worker = new Worker(
    "application-processing",

    async (job) => {

        console.log("Job received:", job.id);

        console.log(
            "Application ID:",
            job.data.applicationId
        );

        const result = await processApplication(
            job.data.applicationId
        );

        console.log(
            "Application processing result:",
            result
        );

        return result;
    },

    {
        connection
    }
);

worker.on("completed", (job) => {

    console.log(
        `Job ${job.id} completed successfully`
    );

});

worker.on("failed", (job, error) => {

    console.error(
        `Job ${job?.id} failed:`,
        error.message
    );

});

console.log(
    "Application worker is running..."
);