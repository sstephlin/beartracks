FROM eclipse-temurin:17-jdk

WORKDIR /app
COPY . .

RUN ./mvnw clean package

CMD ["java", "-jar", "target/s0-1.0-SNAPSHOT.jar"]