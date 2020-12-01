# Specifies where to get the base image (Node v12 in our case) and creates a new container for it
FROM node:12

RUN mkdir -p /usr/src/nideshop
# Set working directory. Paths will be relative this WORKDIR.
WORKDIR /usr/src/nideshop

# Install dependencies
COPY package.json /usr/src/nideshop/
RUN npm install

# Copy source files from host computer to the container
COPY . /usr/src/nideshop

# Specify port app runs on
EXPOSE 8360

# Run the app
CMD [ "npm", "start" ]

#To build the docker image,docker build [username]/[tag] [dockerfile location]
#docker build -t scott/nideshop:latest .
#run
# docker run -p 8000:3001 scott/nideshop