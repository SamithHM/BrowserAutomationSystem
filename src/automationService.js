import {
    getApplicationById,
    updateApplication,
    getPendingApplications
} from "./applicationService.js";

import { submitApplication } from "./browserService.js";


export async function processPendingApplications() {

    console.log("Finding pending applications...");

    const applications =
        await getPendingApplications();

    console.log(
        `Found ${applications.length} pending applications`
    );

    const results = [];

    for (const application of applications) {

        console.log(
            `Processing application: ${application._id}`
        );

        const result =
            await processApplication(
                application._id.toString()
            );

        results.push({
            applicationId:
                application._id.toString(),

            name:
                application.name,

            success:
                result.success,

            error:
                result.error || null
        });
    }

    return {
    total: applications.length,

    successful:
        results.filter(
            result => result.success
        ).length,

    failed:
        results.filter(
            result => !result.success
        ).length,

    results
};
}

export async function processApplication(id) {

    console.log("Starting automation for:", id);

    // STEP 1: Get application from MongoDB
    const application = await getApplicationById(id);

    if (!application) {
        throw new Error("Application not found");
    }

    console.log("Application found:", application);


    // STEP 2: Change status to processing
    await updateApplication(id, {
        status: "processing"
    });

    console.log("Status changed to processing");


    try {

        // STEP 3: Send application to Playwright
        const result = await submitApplication(application);

        console.log("Browser result:", result);


        // STEP 4: Check whether browser automation succeeded
        if (!result.success) {

            await updateApplication(id, {
                status: "failed",
                error: result.error
            });

            return {
                success: false,
                error: result.error
            };
        }


        // STEP 5: Update MongoDB
        const updatedApplication = await updateApplication(
            id,
            {
                status: "completed",
                acknowledgementNumber:
                    result.acknowledgementNumber
            }
        );


        console.log("Application completed successfully");


        return {
            success: true,
            application: updatedApplication
        };


    } catch (error) {

        console.error(
            "Automation failed:",
            error.message
        );


        // STEP 6: Mark application as failed
        await updateApplication(id, {
            status: "failed",
            error: error.message
        });


        return {
            success: false,
            error: error.message
        };
    }
}