package br.senac.recursos;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Regras da estrutura MVC (ADR-014). Violação quebra o build em vez de passar em revisão.
 *
 * <pre>
 * controller (C)  ->  service  ->  repository  ->  model (M)
 * dto             ->  trafega entre controller e service
 * view (V)        ->  front end React em frontend/, consome a API REST dos controllers
 * </pre>
 */
@AnalyzeClasses(packages = "br.senac.recursos", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquiteturaTest {

    @ArchTest
    static final ArchRule modeloNaoDependeDeSpringNemDePersistencia =
            noClasses().that().resideInAPackage("..model..")
                    .should().dependOnClassesThat().resideInAnyPackage(
                            "org.springframework..",
                            "jakarta.persistence..",
                            "javax.persistence..",
                            "org.hibernate..",
                            "java.sql..");

    @ArchTest
    static final ArchRule modeloNaoDependeDasOutrasCamadas =
            noClasses().that().resideInAPackage("..model..")
                    .should().dependOnClassesThat().resideInAnyPackage(
                            "..controller..", "..dto..", "..service..", "..repository..", "..config..",
                            "..security..");

    @ArchTest
    static final ArchRule controllerNaoAcessaRepositorioDiretamente =
            noClasses().that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat().resideInAPackage("..repository..");

    @ArchTest
    static final ArchRule servicoNaoDependeDeControllerNemDeDto =
            noClasses().that().resideInAPackage("..service..")
                    .should().dependOnClassesThat().resideInAnyPackage("..controller..", "..dto..");

    @ArchTest
    static final ArchRule repositorioNaoDependeDeServicoNemDeController =
            noClasses().that().resideInAPackage("..repository..")
                    .should().dependOnClassesThat().resideInAnyPackage("..service..", "..controller..", "..dto..");

    @ArchTest
    static final ArchRule dtoNaoDependeDeServicoNemDeRepositorio =
            noClasses().that().resideInAPackage("..dto..")
                    .should().dependOnClassesThat().resideInAnyPackage("..service..", "..repository..",
                            "..controller..");
}
