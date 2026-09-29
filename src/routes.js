import express from "express";
import {runAutomationAgent} from "./agent.js";
import {
    createApplication,
    getPendingApplications,
    getApplicationById,
    updateApplication,
    createApplications,
    getApplicationStats,
    getAllApplications
} from "./applicationService.js";
import { applicationQueue } from "./queue.js";
const router = express.Router();


router.get("/applications/pending",async (req,res)=>{
    console.log("GET /applications/pending called");
    try{
        const applications=await getPendingApplications();
        res.status(200).json({status:"success",data:applications});
    }catch(error){
        console.error("Error fetching pending applications:",error.message);
        res.status(500).json({status:"error",message:"Internal Server Error"});
    }
});
router.post("/applications/bulk", async (req, res) => {
    console.log("POST /applications/bulk called");

    try {
        const applications = await createApplications(req.body);

        res.status(201).json({
            status: "success",
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error(
            "Error creating applications:",
            error.message
        );

        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});
router.post("/applications",async (req,res)=>{
    try{
        const application=await createApplication(req.body);
        res.status(201).json({status:"success",data:application});
    }catch(error){
        console.error("Error creating application:",error.message);
        res.status(500).json({status:"error",message:error.message});
    }
});
router.get("/applications/stats", async (req, res) => {

    try {

        const stats = await getApplicationStats();

        res.json({
            status: "success",
            data: stats
        });

    } catch (error) {

        console.error("Error getting application stats:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to get application statistics"
        });

    }

});
router.get("/applications", async (req, res) => {

    try {

        const applications = await getAllApplications();

        res.status(200).json({
            status: "success",
            data: applications
        });

    } catch (error) {

        console.error(
            "Error fetching all applications:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Failed to fetch applications"
        });
    }
});
router.get("/applications/:id", async (req, res) => {

    console.log("GET /applications/:id called");

    try {

        const application = await getApplicationById(
            req.params.id
        );

        if (!application) {

            return res.status(404).json({
                status: "error",
                message: "Application not found"
            });

        }

        res.status(200).json({
            status: "success",
            data: application
        });

    } catch (error) {

        console.error(
            "Error fetching application:",
            error.message
        );

        res.status(500).json({
            status: "error",
            message: error.message
        });

    }

});
router.patch("/applications/:id", async (req, res) => {

    console.log("PATCH /applications/:id called");

    try {

        const application = await updateApplication(
            req.params.id,
            req.body
        );

        if (!application) {

            return res.status(404).json({
                status: "error",
                message: "Application not found"
            });

        }

        res.status(200).json({
            status: "success",
            data: application
        });

    } catch (error) {

        console.error(
            "Error updating application:",
            error.message
        );

        res.status(500).json({
            status: "error",
            message: error.message
        });

    }

});
router.post("/applications/:id/process", async (req, res) => {

    try {

        const id = req.params.id;

        console.log(
            "Queueing application:",
            id
        );

        const application = await getApplicationById(id);

        if (!application) {

            return res.status(404).json({
                status: "error",
                message: "Application not found"
            });

        }

        if (application.status === "processing") {

            return res.status(409).json({
                status: "error",
                message: "Application is already processing"
            });

        }

        await updateApplication(id, {
            status: "processing",
            error: null
        });

        const job = await applicationQueue.add(
            "process-application",
            {
                applicationId: id
            }
        );

        console.log(
            "Job added:",
            job.id
        );

        return res.status(202).json({

            status: "success",

            message:
                "Application added to processing queue",

            jobId: job.id,

            applicationId: id

        });

    } catch (error) {

        console.error(
            "Error queueing application:",
            error
        );

        return res.status(500).json({

            status: "error",

            message:
                "Failed to queue application"

        });

    }

});

router.post("/agent", async (req, res) => {

    console.log("POST /agent called");

    try {

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                status: "error",
                message: "message is required"
            });
        }

        console.log("Agent request:", message);

        const result =
            await runAutomationAgent(message);

        res.status(200).json({
            status: "success",
            result: result
        });

    } catch (error) {

        console.error(
            "Agent error:",
            error.message
        );

        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});



export default router;