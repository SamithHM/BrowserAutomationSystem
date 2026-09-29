/* global process */

import "dotenv/config";

import Groq from "groq-sdk";

import {
    getApplicationById,
    updateApplication,
    getPendingApplications
} from "./applicationService.js";

import {
    processApplication,
    processPendingApplications
} from "./automationService.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


const MODEL = "openai/gpt-oss-120b";


const SYSTEM_INSTRUCTIONS = `
You are an application automation assistant.

You help process applications stored in a MongoDB database.

You have tools that allow you to:

- Retrieve a specific application.
- Retrieve all pending applications.
- Update an application's status.
- Process a specific application.
- Process all pending applications.

Rules:

1. When the user asks about a specific application, retrieve it when necessary.

2. When the user asks to change an application's status, use the
    update_application tool.

3. When the user asks to process a specific application, use the
    process_application tool.

4. When the user asks to process ALL pending applications:
    - Use the process_pending_applications tool directly.
    - Do NOT call get_pending_applications first.
    - The process_pending_applications tool is responsible for
    finding pending applications.
    - The backend should process the applications one at a time.
    - Do not process applications whose status is already completed,
    processing, or failed.

5. Do not claim that an application was processed unless the
appropriate processing tool reports success.

6. Report the processing result clearly, including:
    - Total applications processed.
    - Successful applications.
    - Failed applications.
    - Application IDs of failed applications, if any.

7. Do not expose unnecessary MongoDB document data to the user.

Never bypass CAPTCHA or OTP.

If human verification is required, request human intervention.
`;

// ============================================================
// TOOL 1: GET APPLICATION
// ============================================================

async function getApplication(applicationId) {

    const application =
        await getApplicationById(applicationId);


    if (!application) {

        return {
            success: false,
            message: "Application not found"
        };

    }


    return {
        success: true,

        application:
            application.toObject
                ? application.toObject()
                : application
    };
}


// ============================================================
// TOOL 2: UPDATE APPLICATION
// ============================================================

async function updateApplicationStatus(
    applicationId,
    status
) {

    const application =
        await updateApplication(
            applicationId,
            {
                status: status
            }
        );


    if (!application) {

        return {
            success: false,
            message: "Application not found"
        };

    }


    return {
        success: true,

        application:
            application.toObject
                ? application.toObject()
                : application
    };
}
// ============================================================
// TOOL 3: PROCESS APPLICATION
// ============================================================

async function processApplicationTool(applicationId) {

    const result =
        await processApplication(applicationId);

    return result;
}


// ============================================================
// TOOL 4: GET PENDING APPLICATIONS
// ============================================================

async function getPendingApplicationsTool() {

    const applications =
        await getPendingApplications();

    return {
        success: true,
        count: applications.length,
        applications:
            applications.map(application =>
                application.toObject
                    ? application.toObject()
                    : application
            )
    };
}

// ============================================================
// TOOL DEFINITIONS
// ============================================================

const tools = [

    // --------------------------------------------------------
    // GET APPLICATION
    // --------------------------------------------------------

    {
        type: "function",

        function: {

            name: "get_application",

            description:
                "Retrieve an application from MongoDB using its application ID.",

            parameters: {

                type: "object",

                properties: {

                    applicationId: {

                        type: "string",

                        description:
                            "MongoDB ObjectId of the application."
                    }

                },

                required: [
                    "applicationId"
                ]
            }
        }
    },


    // --------------------------------------------------------
    // UPDATE APPLICATION
    // --------------------------------------------------------

    {
        type: "function",

        function: {

            name: "update_application",

            description:
                "Update the status of an application in MongoDB.",

            parameters: {

                type: "object",

                properties: {

                    applicationId: {

                        type: "string",

                        description:
                            "MongoDB ObjectId of the application."
                    },


                    status: {

                        type: "string",

                        enum: [
                            "pending",
                            "processing",
                            "completed",
                            "failed"
                        ],

                        description:
                            "The new status for the application."
                    }

                },

                required: [
                    "applicationId",
                    "status"
                ]
            }
        }
    },

    // --------------------------------------------------------
    // PROCESS APPLICATION
    // --------------------------------------------------------


    {
    type: "function",

    function: {

        name: "process_application",

        description:
            "Process an application using the browser automation workflow. Use this when the user asks to submit or process an application.",

        parameters: {

            type: "object",

            properties: {

                applicationId: {

                    type: "string",

                    description:
                        "MongoDB ObjectId of the application to process."

                }

            },

            required: [
                "applicationId"
            ]

        }

    }
},

// --------------------------------------------------------
// GET PENDING APPLICATIONS
// --------------------------------------------------------

{
    type: "function",

    function: {

        name: "get_pending_applications",

        description:
            "Retrieve all applications from MongoDB whose status is pending.",

        parameters: {

            type: "object",

            properties: {}

        }
    }
},

// ============================================================
//Process Pending Applications
// ============================================================

{
    type: "function",

    function: {
        name: "process_pending_applications",

        description:
            "Process all pending applications in MongoDB. " +
            "This tool internally finds pending applications " +
            "and processes them one at a time. " +
            "Use this tool directly when the user asks to " +
            "process all pending applications.",

        parameters: {
            type: "object",

            properties: {},

            required: []
        }
    }
}
];


// ============================================================
// AGENT
// ============================================================

export async function runAutomationAgent(input) {


    // --------------------------------------------------------
    // Initial conversation
    // --------------------------------------------------------

    const messages = [

        {
            role: "system",

            content: SYSTEM_INSTRUCTIONS
        },

        {
            role: "user",

            content: input
        }

    ];


    // --------------------------------------------------------
    // Allow multiple rounds of tool calls
    // --------------------------------------------------------

    const MAX_TOOL_ROUNDS = 12;


    for (
        let round = 1;
        round <= MAX_TOOL_ROUNDS;
        round++
    ) {


        console.log(
            `\n========== Agent Round ${round} ==========`
        );


        // ----------------------------------------------------
        // Ask Groq what to do
        // ----------------------------------------------------

        const response =
            await groq.chat.completions.create({

                model: MODEL,

                messages: messages,

                tools: tools,

                tool_choice: "auto"

            });


        const message =
            response.choices[0].message;


        console.log(
            "Groq response:",
            message
        );


        // ----------------------------------------------------
        // No tool call
        // ----------------------------------------------------

        if (
            !message.tool_calls ||
            message.tool_calls.length === 0
        ) {

            console.log(
                "No more tools required."
            );


            return message.content;
        }


        // ----------------------------------------------------
        // Add Groq's tool-call message
        // ----------------------------------------------------

        messages.push(message);


        // ----------------------------------------------------
        // Execute every requested tool
        // ----------------------------------------------------

        for (
            const toolCall of message.tool_calls
        ) {


            const functionName =
                toolCall.function.name;


            const toolArguments =
                JSON.parse(
                    toolCall.function.arguments
                );


            console.log(
                "Tool requested:",
                functionName
            );


            console.log(
                "Tool arguments:",
                toolArguments
            );


            let result;


            // =================================================
            // GET APPLICATION
            // =================================================

            if (
                functionName === "get_application"
            ) {

                result =
                    await getApplication(
                        toolArguments.applicationId
                    );

            }


            // =================================================
            // UPDATE APPLICATION
            // =================================================

            else if (
                functionName === "update_application"
            ) {

                result =
                    await updateApplicationStatus(
                        toolArguments.applicationId,

                        toolArguments.status
                    );

            }


            // =================================================
            // PROCESS APPLICATION
            // =================================================

            else if (
    functionName === "process_application"
) {

    result =
        await processApplicationTool(
            toolArguments.applicationId
        );

}
// =================================================
            // GET PENDING APPLICATIONS
// =================================================

else if (
    functionName === "get_pending_applications"
) {

    result =
        await getPendingApplicationsTool();

}

// =================================================
            // PROCESS PENDING APPLICATIONS
// =================================================

else if (
    functionName === "process_pending_applications"
) {

    result =
        await processPendingApplications();

    console.log(
        "Pending applications processing completed:",
        result
    );

    return JSON.stringify({
        success: true,
        message: "Pending applications processing completed.",
        ...result
    });
}
            // =================================================
            // UNKNOWN TOOL
            // =================================================

            else {

                result = {

                    success: false,

                    message:
                        `Unknown tool: ${functionName}`

                };

            }


            console.log(
                "Tool result:",
                result
            );


            // ------------------------------------------------
            // Give tool result back to Groq
            // ------------------------------------------------

            messages.push({

                role: "tool",

                tool_call_id:
                    toolCall.id,

                content:
                    JSON.stringify(result)

            });

        }

        // ----------------------------------------------------
        // Loop continues.
        //
        // Groq gets the tool result and decides:
        //
        // 1. Call another tool
        // OR
        // 2. Give final answer
        //
        // ----------------------------------------------------
    }


    // --------------------------------------------------------
    // Maximum tool rounds reached
    // --------------------------------------------------------

    throw new Error(
        "Agent exceeded the maximum number of tool rounds."
    );
}