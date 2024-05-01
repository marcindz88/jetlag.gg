# Use a lightweight base image
FROM nginx:alpine

# Copy the static website files to the Nginx document root
COPY dist/frontend /usr/share/nginx/html

# Copy nginx configuration file
COPY /nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 80
