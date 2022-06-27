FROM hazmi35/node:18-dev-alpine as build-stage

LABEL name "venti (build-stage)"
LABEL maintainer "FrutBits Indonesia <contact@frutbits.org>"

WORKDIR /tmp/build

# Install build tools for node-gyp
RUN apk add --no-cache build-base git python3

# Copy package.json and package-lock.json
COPY package.json .
COPY package-lock.json .

# Install node dependencies
RUN npm install

# Now copy project files
COPY . .

# Build typescript project
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Get ready for production
FROM hazmi35/node:18-alpine

LABEL name "venti"
LABEL maintainer "FrutBits Indonesia <contact@frutbits.org>"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache tzdata

# Copy needed project files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/package-lock.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist


CMD ["node", "--experimental-specifier-resolution=node", "dist/main.js"]