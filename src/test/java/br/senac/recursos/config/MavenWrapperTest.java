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
}
