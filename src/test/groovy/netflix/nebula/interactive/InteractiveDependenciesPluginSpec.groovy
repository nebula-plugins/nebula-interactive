package netflix.nebula.interactive

import nebula.test.IntegrationSpec

class InteractiveDependenciesPluginSpec extends IntegrationSpec {
    def 'serves a browser based front-end showing the dependency tree'() {
        setup:
        buildFile << '''
            apply plugin: 'java'
            apply plugin: 'nebula-interactive'
            repositories { mavenLocal() }
//            dependencies { compile 'org.springframework:spring-tx:+' }
            dependencies {
                compile 'com.thinkaurelius.titan:titan-core:0.4.5-SNAPSHOT'
//                compile 'com.thinkaurelius.titan:titan-cassandra:0.9.0-SNAPSHOT'
                compile 'org.codehaus.groovy:groovy-all:2.3.3'
            }
        '''.stripIndent()

        expect:
        runTasksSuccessfully('interactive')
    }
}
