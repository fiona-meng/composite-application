const express = require('express');
const axios = require('axios');
const router = express.Router();

const APPOINTMENT_SERVICE_URL = 'http://localhost:3001/appointments';
const SCHEDULE_SERVICE_URL = 'http://localhost:3002/schedules';

compositeRouter.get('/scheduleWithAppointments', async (req, res) => {
    try {
        const { sectionId } = req.query;

        const scheduleResponse = await axios.get(`${SCHEDULE_SERVICE_URL}/sections/${sectionId}`);
        const schedules = scheduleResponse.data;

        const appointmentsResponse = await axios.get(`${APPOINTMENT_SERVICE_URL}/schedules/${schedules[0].id}`);
        const appointments = appointmentsResponse.data;

        res.json({ schedules, appointments });
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

compositeRouter.post('/createScheduleWithAppointments', async (req, res) => {
    try {
        const scheduleResponse = await axios.post(SCHEDULE_SERVICE_URL, req.body.schedule);
        const newSchedule = scheduleResponse.data;

        const appointments = req.body.appointments.map(appointment => ({
            ...appointment,
            scheduleId: newSchedule.id,
        }));
        const appointmentsResponse = await axios.post(APPOINTMENT_SERVICE_URL, { appointments });
        
        res.status(201).json({ schedule: newSchedule, appointments: appointmentsResponse.data });
    } 
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});

compositeRouter.put('/updateScheduleWithAppointments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const scheduleResponse = await axios.put(`${SCHEDULE_SERVICE_URL}/${id}`, req.body.schedule);
        const updatedSchedule = scheduleResponse.data;

        const appointments = req.body.appointments.map(appointment => ({
            ...appointment,
            scheduleId: id,
        }));
        const appointmentsResponse = await axios.put(`${APPOINTMENT_SERVICE_URL}/bulkUpdate`, { appointments });

        res.json({ updatedSchedule, updatedAppointments: appointmentsResponse.data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

compositeRouter.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [deleteSchedules, deleteAppointments] = await Promise.all([
            axios.delete(`${SCHEDULE_SERVICE_URL}/users/${userId}`),
            axios.delete(`${APPOINTMENT_SERVICE_URL}/users/${userId}`),
        ]);

        res.json({
            message: `User ${userId}'s schedules and appointments deleted.`,
            deleteSchedules: deleteSchedules.data,
            deleteAppointments: deleteAppointments.data,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = compositeRouter;