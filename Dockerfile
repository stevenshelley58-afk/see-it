# Use official Node.js 20 image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only the app directory (Remix app)
COPY app ./app

# Copy package.json and package-lock if exists
COPY app/package*.json ./app/

# Install dependencies
RUN cd app && npm ci --only=production

# Build the Remix app
RUN cd app && npm run build

# Expose the port (Remix default 3000 or as defined)
EXPOSE 3000

# Start the app
CMD ["sh","-c","cd app && npm start"]
