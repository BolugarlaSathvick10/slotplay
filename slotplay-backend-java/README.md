# SlotPlay Backend (Java 21 LTS / Spring Boot 3)

This is the Java Spring Boot migration of the SlotPlay backend, designed as an in-place, contract-compatible replacement for the Node.js / Express backend.

## Architecture & Technology Stack
- **Language:** Java 21 LTS
- **Framework:** Spring Boot 3.3.5
- **Security:** Spring Security (HTTP session cookie `slotplay.sid`, BCrypt 12 rounds)
- **Data Access:** Spring Data JPA, Hibernate, PostgreSQL JDBC Driver, HikariCP
- **Migrations:** Flyway (`V1__initial_schema.sql`)
- **Documentation:** Springdoc OpenAPI (Swagger UI at `/swagger-ui.html`)
- **Validation:** Jakarta Bean Validation (Hibernate Validator)
- **Testing:** JUnit 5, Spring Boot Test, MockMvc, H2 (isolated in-memory test profile)

## Prerequisites
- Java 21 LTS (or compatible JDK 21+)
- Maven (or use the included `mvnw` / `mvnw.cmd` wrapper)

## Running Locally

### 1. Configure Environment Variables
Copy `.env.example` to your environment or create a `.env` file with your Neon PostgreSQL credentials:
```bash
cp .env.example .env
```

Ensure the following variables are exported or defined:
```bash
export DATABASE_URL="postgresql://<neon-host>/neondb?sslmode=require"
export DATABASE_USERNAME="<db-user>"
export DATABASE_PASSWORD="<db-password>"
export FRONTEND_URL="http://localhost:3000"
export PORT=4000
export RESEND_API_KEY="re_xxxxxxxxxxxxxxx"
export EMAIL_FROM="SlotPlay <slotplay@nmart.me>"
```

### 2. Run Tests
The automated test suite runs with an isolated in-memory H2 database under the `test` profile. It never connects to or modifies the live database:
```bash
./mvnw test
# Windows:
.\mvnw.cmd test
```

### 3. Run Development Server
```bash
./mvnw spring-boot:run
# Windows:
.\mvnw.cmd spring-boot:run
```

Once running:
- **API Health:** `http://localhost:4000/api/health`
- **Swagger UI:** `http://localhost:4000/swagger-ui.html`
- **OpenAPI JSON Docs:** `http://localhost:4000/api-docs`

## Package Structure
```
com.slotplay/
├── SlotPlayApplication.java   # Spring Boot entry point
├── config/                    # Security, CORS, JPA, OpenAPI configurations
├── controller/                # REST Controllers matching Express routes
├── dto/                       # Standard response & error envelopes (ApiResponse, ApiErrorResponse)
├── exception/                 # AppException and GlobalExceptionHandler
├── repository/                # Spring Data JPA repositories
└── service/                   # Business logic services
```
