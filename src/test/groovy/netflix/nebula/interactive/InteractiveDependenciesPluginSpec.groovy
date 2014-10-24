package netflix.nebula.interactive

import nebula.test.IntegrationSpec

class InteractiveDependenciesPluginSpec extends IntegrationSpec {
    def 'serves a browser based front-end showing the dependency tree'() {
        setup:
        buildFile << '''
            apply plugin: 'java'
            apply plugin: 'nebula-interactive'
            repositories { mavenCentral() }
            dependencies { compile 'org.springframework:spring-tx:+' }
        '''.stripIndent()

        expect:
        runTasksSuccessfully('interactive')
    }
}
