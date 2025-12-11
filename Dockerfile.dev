FROM node:22

WORKDIR /app

# Don't copy anything - everything will be mounted via volumes

# Expose the port Next.js runs on
EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development

# Start Next.js in development mode
CMD ["npm", "run", "dev"]