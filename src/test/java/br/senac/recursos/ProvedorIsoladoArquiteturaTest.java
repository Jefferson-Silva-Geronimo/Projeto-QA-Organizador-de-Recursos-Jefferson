package br.senac.recursos;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * CT-106, CEN-08: o provedor de notificação fica isolado em {@code integration}. Nenhuma outra camada o
 * conhece, então trocar o adaptador altera um componente e nada mais.
 */
@AnalyzeClasses(packages = "br.senac.recursos", importOptions = ImportOption.DoNotIncludeTests.class)
class ProvedorIsoladoArquiteturaTest {

    @ArchTest
    static final ArchRule ninguemAlemDaConfiguracaoDependeDoAdaptador =
            noClasses().that().resideOutsideOfPackages("..integration..", "..config..")
                    .should().dependOnClassesThat().resideInAPackage("..integration..");
}
