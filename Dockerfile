# --- Stage 1: Build Frontend ---
FROM node:22.18.0 AS node_builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci --no-fund --no-audit
COPY client/ ./
RUN npm run build

# --- Stage 2: Final Runtime (PHP + Node) ---
FROM php:8.2-apache

# Build Arguments
ARG APP_NAME=theMenu
ARG APP_ENV=local
ARG DB_CONNECTION=mysql
ARG DB_HOST=db
ARG DB_PORT=3306
ARG DB_DATABASE=themenu
ARG DB_USERNAME=themenu_user
ARG DB_PASSWORD=secret

# 1. Install System Dependencies + Node.js (for Stage 2)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    gnupg \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    zip \
    unzip \
    libzip-dev \
    # Install Node.js 22.x in the final image
    && curl -sL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Enable Apache mod_rewrite
RUN a2enmod rewrite

# 3. Install PHP Extensions
RUN docker-php-ext-install pdo_mysql mbstring xml bcmath curl gd zip

# 4. Set Apache Document Root to Laravel public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 5. Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 6. Copy Backend App
WORKDIR /var/www/html
COPY server/ /var/www/html

# 7. Copy Built Frontend from Stage 1
COPY --from=node_builder /app/dist/ /var/www/html/public/

# 8. Create .env file (Safe defaults)
RUN touch .env && \
    echo "APP_NAME=${APP_NAME}" >> .env && \
    echo "APP_ENV=${APP_ENV}" >> .env && \
    echo "DB_CONNECTION=${DB_CONNECTION}" >> .env && \
    echo "DB_HOST=${DB_HOST}" >> .env && \
    echo "DB_PORT=${DB_PORT}" >> .env && \
    echo "DB_DATABASE=${DB_DATABASE}" >> .env && \
    echo "DB_USERNAME=${DB_USERNAME}" >> .env && \
    echo "DB_PASSWORD=${DB_PASSWORD}" >> .env

# 9. Final Permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["apache2-foreground"]