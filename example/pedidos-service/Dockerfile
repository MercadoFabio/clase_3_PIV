# ---------------------------------------------------------------------------
# Etapa 1: Compilar. Necesita Maven y el JDK completo.
# ---------------------------------------------------------------------------

# Arranca desde la imagen oficial de Maven 3.9 que ya trae adentro el JDK 21 de
# Eclipse Temurin, y le pone de nombre "build" a esta etapa.
FROM maven:3.9-eclipse-temurin-21 AS build

# Fija /app como directorio de trabajo adentro del contenedor.
WORKDIR /app

# Copia solo el pom.xml (donde estan declaradas las dependencias) al directorio
# actual. Va primero para aprovechar la cache de Docker.
COPY pom.xml .

# Descarga todas las dependencias declaradas en el pom y las deja en la cache
# local de Maven. Mientras el pom.xml no cambie, Docker saltea este paso entero.
RUN mvn -q dependency:go-offline

# Copia la carpeta src/ de la maquina hacia /app/src del contenedor.
COPY src ./src

# Compila y empaqueta el proyecto: deja el .jar ejecutable en /app/target/.
RUN mvn -q package -DskipTests

# ---------------------------------------------------------------------------
# Etapa 2: Ejecutar. Alcanza con el JRE, que es mucho mas chico que el JDK.
# ---------------------------------------------------------------------------

# Segundo FROM: descarta la etapa anterior y arranca desde una imagen que solo
# trae el runtime de Java 21. Maven, el JDK y el codigo fuente quedan afuera.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copia el .jar generado en la etapa "build" y lo renombra a app.jar.
COPY --from=build /app/target/*.jar app.jar

# Levanta el microservicio de pedidos. Escucha en el puerto 8081 (definido
# en application.properties).
ENTRYPOINT ["java", "-jar", "app.jar"]
