FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3000
ENV SCHEDULE_SERVICE_URL=http://44.223.182.119/schedules
ENV APPOINTMENT_SERVICE_URL=http://44.223.182.119/appointments
ENV COURSE_SERVICE_URL=http://52.202.78.156/courses
ENV SECTION_SERVICE_URL=http://52.202.78.156/sections
ENV USER_SECTION_SERVICE_URL=http://54.243.137.132/user-sections

EXPOSE 3000

CMD ["node", "server.js"]
