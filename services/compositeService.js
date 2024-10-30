const express = require('express');
const axios = require('axios');
const compositeRouter = express.Router();

const APPOINTMENT_SERVICE_URL = 'http://localhost:3001/appointments';
const SCHEDULE_SERVICE_URL = 'http://localhost:3001/schedules';
const COURSE_SERVICE_URL = 'http://localhost:3003/courses';
const SECTION_SERVICE_URL = 'http://localhost:3003/sections';
const USER_SECTION_SERVICE_URL = 'http://localhost:3004/user-sections';

compositeRouter.get('/scheduleWithAppointments/userId/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const scheduleResponse = await axios.get(`${SCHEDULE_SERVICE_URL}/users/${userId}`);
        const schedules = scheduleResponse.data;

        const appointmentsResponse = await axios.get(`${APPOINTMENT_SERVICE_URL}/users/${userId}`);
        const appointments = appointmentsResponse.data;

        res.json({ schedules, appointments });
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

compositeRouter.get('/sectionsWithCourses/userId/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const userSectionResponse = await axios.get(`${USER_SECTION_SERVICE_URL}/users/${userId}`);
        const sectionInfo = userSectionResponse.data;

        const sectionDetails = await Promise.all(
            sectionInfo.map(async (section) => {
                const sectionResponse = await axios.get(`${SECTION_SERVICE_URL}/${section.sectionId}`);
                return sectionResponse.data;
            })
        );

        const uniqueCourseIds = [...new Set(sectionDetails.map(section => section.courseId))];
        const courseDetails = await Promise.all(
            uniqueCourseIds.map(async (courseId) => {
                const courseResponse = await axios.get(`${COURSE_SERVICE_URL}/${courseId}`);
                return courseResponse.data;
            })
        );

        const combinedData = sectionInfo.map((section) => {
            const sectionDetail = sectionDetails.find(detail => detail.id === section.sectionId);
            
            const courseDetail = courseDetails.find(course => course.id === sectionDetail.courseId);

            return {
                userId: section.userId,
                sectionId: section.sectionId,
                sectionCode: sectionDetail.code,
                courseId: sectionDetail.courseId,
                courseCode: courseDetail.code,
                courseName: courseDetail.name
            };
        });

        res.json(combinedData);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 异步
compositeRouter.post('/scheduleWithUserSection', async (req, res) => {
    try {
        const { userId, sectionId, startTime, endTime, location } = req.body;

        const schedulePromise = axios.post(`${SCHEDULE_SERVICE_URL}`, {
            userId: userId,
            sectionId: sectionId, 
            startTime: startTime, 
            endTime: endTime, 
            location: location
        }).then(response => response.data);

        const userSectionPromise = axios.post(`${USER_SECTION_SERVICE_URL}`, {
            userId: userId,
            sectionId: sectionId
        }).then(response => response.data).catch(error => {
            if (error.response && error.response.status === 409) {
                return axios.get(`${USER_SECTION_SERVICE_URL}/user-sections`, {
                    params: { userId: userId, sectionId: sectionId }
                }).then(response => response.data); 
            } else {
                throw error;
            }
        });

        const [schedule, userSection] = await Promise.all([schedulePromise, userSectionPromise]);

        res.json({
            message: "Schedule and User Section successfully added",
            schedule,
            userSection
        });
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 同步
// compositeRouter.post('/scheduleWithUserSection', async (req, res) => {
//     try {
//         const { userId, sectionId, startTime, endTime, location } = req.body;

//         const scheduleResponse = await axios.post(`${SCHEDULE_SERVICE_URL}`, {
//             userId: userId,
//             sectionId: sectionId, 
//             startTime: startTime, 
//             endTime: endTime, 
//             location: location
//         });

//         const schedule = scheduleResponse.data; 

//         let userSection;
//         try {
//             const newUserSectionResponse = await axios.post(`${USER_SECTION_SERVICE_URL}`, {
//                 userId: userId,
//                 sectionId: sectionId
//             });
//             userSection = newUserSectionResponse.data;
//         } catch (error) {
//             if (error.response && error.response.status === 409) {
//                 const existingUserSectionResponse = await axios.get(`${USER_SECTION_SERVICE_URL}/user-sections`, {
//                     params: { userId: userId, sectionId: sectionId }
//                 });
//                 userSection = existingUserSectionResponse.data;
//             } else {
//                 throw error;
//             }
//         }
//         res.json({
//             message: "Schedule and User Section successfully added",
//             schedule,
//             userSection
//         });
//     } 
//     catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

compositeRouter.put('/scheduleWithAppointments/scheduleId/:scheduleId', async (req, res) => {
    const { scheduleId } = req.params;  
    const { startTime, endTime, location } = req.body;

    try {
        const updateScheduleResponse = await axios.put(`${SCHEDULE_SERVICE_URL}/${scheduleId}`, { 
            startTime: startTime,
            endTime: endTime, 
            location: location
        });

        let appointments = [];
        try {
            const appointmentsResponse = await axios.get(`${APPOINTMENT_SERVICE_URL}/schedules/${scheduleId}`);
            appointments = appointmentsResponse.data; 
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`No appointments found for scheduleId: ${scheduleId}`);
            } else {
                throw error; 
            }
        }

        if (appointments.length > 0) {
            const deletePromises = appointments.map(appointment => 
                axios.delete(`${APPOINTMENT_SERVICE_URL}/${appointment.id}`)
            );

            await Promise.all(deletePromises);
        }

        res.json({
            message: "Schedule updated and corresponding appointments deleted successfully",
            updatedSchedule: updateScheduleResponse.data,
            deletedAppointments: appointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

delete 某个schedule和相关appointment
compositeRouter.delete('/scheduleWithAppointments/scheduleId/:scheduleId', async (req, res) => {
    const { scheduleId } = req.params;  

    try {
        const deleteScheduleResponse = await axios.delete(`${SCHEDULE_SERVICE_URL}/${scheduleId}`);

        let appointments = [];
        try {
            const appointmentsResponse = await axios.get(`${APPOINTMENT_SERVICE_URL}/schedules/${scheduleId}`);
            appointments = appointmentsResponse.data; 
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`No appointments found for scheduleId: ${scheduleId}`);
            } else {
                throw error; 
            }
        }

        if (appointments.length > 0) {
            const deletePromises = appointments.map(appointment => 
                axios.delete(`${APPOINTMENT_SERVICE_URL}/${appointment.id}`)
            );

            await Promise.all(deletePromises);
        }

        res.json({
            message: "Schedule updated and corresponding appointments deleted successfully",
            deletedSchedule: deleteScheduleResponse.data,
            deletedAppointments: appointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = compositeRouter;