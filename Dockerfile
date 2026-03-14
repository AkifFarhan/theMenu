# --- Stage 1: Build Frontend ---
FROM node:22.18.0 AS node_builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci --no-fund --no-audit
COPY client/ ./
RUN npm run build

# --- Stage 2: Final Runtime (PHP + Apache) ---
FROM php:8.2-apache

# Build Arguments
ARG APP_NAME=theMenu
ARG APP_ENV=local
ARG DB_CONNECTION=sqlsrv
ARG DB_HOST=db
ARG DB_PORT=1433
ARG DB_DATABASE=themenu
ARG DB_USERNAME=sa
ARG DB_PASSWORD=Password123!

# 1. Install System Dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    gnupg2 \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    zip \
    unzip \
    libzip-dev \
    apt-transport-https \
    ca-certificates \
    && curl -sL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Microsoft ODBC Driver for MSSQL
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg \
    && curl -sSL https://packages.microsoft.com/config/debian/12/prod.list \
        > /etc/apt/sources.list.d/mssql-release.list \
    && sed -i 's/^Types: deb/Types: deb\nSigned-By: \/usr\/share\/keyrings\/microsoft-prod.gpg/' \
        /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Enable Apache mod_rewrite
RUN a2enmod rewrite

# 4. Install PHP Extensions
RUN docker-php-ext-install mbstring xml bcmath curl gd zip

# 5. Install SQLSRV PHP Extensions
RUN pecl channel-update pecl.php.net \
    && pecl install sqlsrv-5.12.0 pdo_sqlsrv-5.12.0 \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv \
    && echo "extension=sqlsrv.so" >> /usr/local/etc/php/php.ini \
    && echo "extension=pdo_sqlsrv.so" >> /usr/local/etc/php/php.ini

# 6. Set Apache Document Root to Laravel public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 7. Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 8. Copy Backend App
WORKDIR /var/www/html
COPY server/ /var/www/html

# 9. Copy Built Frontend from Stage 1
COPY --from=node_builder /app/dist/ /var/www/html/public/

# 10. Install Composer Dependencies
RUN composer install --ignore-platform-reqs --no-interaction --prefer-dist

# 11. Create .env file
RUN touch .env && \
    echo "APP_NAME=${APP_NAME}" >> .env && \
    echo "APP_ENV=${APP_ENV}" >> .env && \
    echo "DB_CONNECTION=${DB_CONNECTION}" >> .env && \
    echo "DB_HOST=${DB_HOST}" >> .env && \
    echo "DB_PORT=${DB_PORT}" >> .env && \
    echo "DB_DATABASE=${DB_DATABASE}" >> .env && \
    echo "DB_USERNAME=${DB_USERNAME}" >> .env && \
    echo "DB_PASSWORD=${DB_PASSWORD}" >> .env && \
    echo "DB_TRUST_SERVER_CERTIFICATE=true" >> .env

# 12. Final Permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["apache2-foreground"]