# Imagem da API (Spring Boot, Java 21) para o ambiente de E2E e para subir a aplicação do zero.
# Duas etapas: compila o jar com o Maven Wrapper do repositório e copia só o jar para a imagem de execução.
# Imagens fixadas por digest, como no compose.yaml. Nenhum segredo entra na imagem: tudo vem de variáveis de ambiente.

# ---- compilação
FROM eclipse-temurin:21-jdk@sha256:23cc5734ff46e776f51ce66eb9ee08444fd47caabec0a95b7eb6e94be2d3696d AS compilacao
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -ntp -q dependency:go-offline
COPY src src
# Os testes rodam no job `test` da CI; aqui só se empacota.
RUN ./mvnw -B -ntp -q -DskipTests package && mv target/*.jar app.jar

# ---- execução
FROM eclipse-temurin:21-jre@sha256:227118764cccd3c3294617061aaa93a08309c63a395eefa83e6b35032992ea99
RUN useradd --system --no-create-home --uid 10001 aplicacao
WORKDIR /app
COPY --from=compilacao /app/app.jar app.jar
USER aplicacao
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
