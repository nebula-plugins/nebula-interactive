package netflix.nebula.interactive

import nebula.test.IntegrationSpec

class InteractiveDependenciesPluginSpec extends IntegrationSpec {
    def 'opens browser'() {
        setup:
        buildFile << '''
            apply plugin: 'java'
            apply plugin: 'nebula-interactive'
            group = 'netflix'
            repositories { mavenCentral() }
//            dependencies { compile 'org.springframework:spring-tx:+' }
            dependencies {
                compile 'com.thinkaurelius.titan:titan-core:+'
                compile 'com.thinkaurelius.titan:titan-cassandra:+'
                compile 'org.codehaus.groovy:groovy-all:2.3.3'
            }
        '''.stripIndent()

        expect:
        runTasksSuccessfully('interactive')
    }
}
