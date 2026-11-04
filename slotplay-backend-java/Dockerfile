# Multi-stage Dockerfile for SlotPlay Java Spring Boot Backend

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper & POM first for layer caching
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Make wrapper executable & cache dependencies
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true

# Copy application source code
COPY src src

# Package the application JAR (skip tests during container image build)
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Minimal Production Runtime ──────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install wget for container health checks
RUN apk add --no-cache wget

# Create unprivileged application user
RUN addgroup -S slotplay && adduser -S slotplay -G slotplay

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R slotplay:slotplay /app

# Copy the built JAR from builder stage
COPY --from=builder --chown=slotplay:slotplay /build/target/*.jar /app/app.jar

USER slotplay

ENV PORT=4000 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]

