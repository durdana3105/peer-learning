FROM node:20-alpine AS base
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80 
CMD ["nginx","-g","daemon off;"]