import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },
        applicationType: {
            type: String,
            required: true,
            trim: true
        },

        documentPath: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "completed",
                "failed"
            ],
            default: "pending"
        },

        acknowledgementNumber: {
            type: String,
            default: null
        },

        submittedAt: {
            type: Date,
            default: Date.now
        },

        error: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Application = mongoose.model(
    "Application",
    applicationSchema
);

export default Application;