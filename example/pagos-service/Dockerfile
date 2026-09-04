# ---------------------------------------------------------------------------
# Etapa 1: Compilar. Necesita Maven y el JDK completo.
# ---------------------------------------------------------------------------

FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn -q dependency:go-offline

COPY src ./src

RUN mvn -q package -DskipTests

# ---------------------------------------------------------------------------
# Etapa 2: Ejecutar. Alcanza con el JRE, que es mucho mas chico que el JDK.
# ---------------------------------------------------------------------------

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Levanta el microservicio de pagos. Escucha en el puerto 8082 (definido
# en application.properties).
ENTRYPOINT ["java", "-jar", "app.jar"]
