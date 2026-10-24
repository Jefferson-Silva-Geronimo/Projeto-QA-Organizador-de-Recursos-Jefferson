package br.senac.recursos.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import org.junit.jupiter.api.Test;

/**
 * SEC-03 (F7-06, OWASP A03): o wrapper do Maven só confere a distribuição que baixa se o arquivo de propriedades
 * trouxer a soma SHA-256. Quem subir a versão do Maven precisa atualizar a soma junto com a URL.
 */
class MavenWrapperTest {

    private static final Path PROPRIEDADES = Path.of(".mvn", "wrapper", "maven-wrapper.properties");

    private static Properties ler() throws IOException {
        Properties p = new Properties();
        try (Reader r = Files.newBufferedReader(PROPRIEDADES, StandardCharsets.UTF_8)) {
            p.load(r);
        }
        return p;
    }

    @Test
    void distribuicaoDoMavenTemSomaSha256DeSessentaEQuatroHexadecimais() throws IOException {
        assertThat(ler().getProperty("distributionSha256Sum"))
                .as("distributionSha256Sum em .mvn/wrapper/maven-wrapper.properties (SEC-03)")
                .matches("[0-9a-f]{64}");
    }

    @Test
    void distribuicaoDoMavenVemDoMavenCentralPorHttps() throws IOException {
        assertThat(ler().getProperty("distributionUrl"))
                .startsWith("https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/");
    }

    // ---- F7-14: o mvnw só baixa o .zip (a soma é a dele) se houver `unzip`; sem ele troca por .tar.gz e a soma não confere.

    private static final Path DOCKERFILE = Path.of("Dockerfile");

    private static String dockerfile() throws IOException {
        return Files.readString(DOCKERFILE, StandardCharsets.UTF_8);
    }

    @Test
    void dockerfileDaApiInstalaUnzipAntesDeRodarOMvnw() throws IOException {
        String texto = dockerfile();
        int unzip = texto.indexOf("apt-get install");
        int mvnw = texto.indexOf("./mvnw");
        assertThat(unzip).as("Dockerfile instala unzip com apt-get no estágio de compilação").isGreaterThanOrEqualTo(0);
        assertThat(texto.substring(Math.max(unzip, 0))).contains("unzip");
        assertThat(unzip).as("o unzip é instalado antes da primeira chamada ao ./mvnw").isLessThan(mvnw);
    }

    @Test
    void unzipNaoVaiParaAImagemFinalDeExecucao() throws IOException {
        String texto = dockerfile();
        String execucao = texto.substring(texto.lastIndexOf("FROM "));
        assertThat(execucao).startsWith("FROM eclipse-temurin:21-jre");
        assertThat(execucao).doesNotContain("unzip").doesNotContain("apt-get");
    }

    @Test
    void todaImagemBaseDoDockerfileContinuaFixadaPorDigest() throws IOException {
        assertThat(dockerfile().lines().filter(l -> l.startsWith("FROM ")).toList())
                .isNotEmpty()
                .allSatisfy(l -> assertThat(l).contains("@sha256:"));
    }
}
