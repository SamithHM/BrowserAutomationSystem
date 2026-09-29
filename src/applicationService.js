import Application from "./models/Application.js";

export async function createApplication(data){
    const application=await Application.create(data);
    return application;
}

export async function getPendingApplications(){
    const applications=await Application.find({status:"pending"});
    return applications;
};

export async function getApplicationById(id) {

    const application = await Application.findById(id);

    return application;
}

export async function updateApplication(id, data) {

    const application = await Application.findByIdAndUpdate(
        id,
        data,
        {
            new: true
        }
    );

    return application;
}

export async function createApplications(data) {
    const applications = await Application.insertMany(data);
    return applications;
}


export async function getApplicationStats() {

    const total = await Application.countDocuments();

    const pending = await Application.countDocuments({
        status: "pending"
    });

    const processing = await Application.countDocuments({
        status: "processing"
    });

    const completed = await Application.countDocuments({
        status: "completed"
    });

    const failed = await Application.countDocuments({
        status: "failed"
    });

    return {
        total,
        pending,
        processing,
        completed,
        failed
    };
}

export async function getAllApplications() {

    const applications = await Application.find();

    return applications;
}