# Use an official Node runtime as the parent image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Add build arguments
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_GENERATE_CASE_URL

# Set environment variables
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_GENERATE_CASE_URL=$REACT_APP_GENERATE_CASE_URL

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the React app
RUN npm run build

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run the app when the container launches
CMD ["npm", "start"]
