# syntax=docker/dockerfile:1
# Production image: Node builds static assets → nginx serves them.
# Build-time env: pass REACT_APP_* as --build-arg (see README + docker-compose).

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

ARG REACT_APP_PAYMENT_API_URL
ENV REACT_APP_PAYMENT_API_URL=${REACT_APP_PAYMENT_API_URL}

ARG REACT_APP_SQUARE_APPLICATION_ID
ENV REACT_APP_SQUARE_APPLICATION_ID=${REACT_APP_SQUARE_APPLICATION_ID}

ARG REACT_APP_SQUARE_LOCATION_ID
ENV REACT_APP_SQUARE_LOCATION_ID=${REACT_APP_SQUARE_LOCATION_ID}

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
