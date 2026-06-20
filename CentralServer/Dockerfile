FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copier le code
COPY . .

# Compiler avec classpath explicite (tous les JAR)
RUN javac -cp "lib/*" server/src/*.java

EXPOSE 9000

# Lancer avec le même classpath
CMD ["java", "-cp", "lib/*:server/src", "TrackrCentralServer", "9000"]

